// Constants and dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const qrcode = require('qrcode');
const multer = require('multer');
const {Client, LocalAuth, MessageMedia, Location} = require('whatsapp-web.js');
const {Server} = require("socket.io");
const exec = require("child_process");
const os = require("os");

require('dotenv').config();
let client;

// Configuration
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
const PROFILES = process.env.PROFILES || '.whats_profiles';

function execute(command){
  let version = exec.execSync(command);
  return version.toString();
}

function update_last_version(engine, sector){
  let local_version = execute(`npm list -l --depth=0 | awk -F@ '/${engine.split("/")[0]}/ { print $${sector}}'`);
  let remote_version = execute(`npm show ${engine} version`);
  console.log(`ENGINE: ${engine} VERSÃO_LOCAL: ${local_version} VERSÃO_REMOTA: ${remote_version}`)
  if (parseInt(local_version.split('\n')[0].split('.').join('')) < parseInt(remote_version.split('\n')[0].split('.').join(''))) {
    console.log('VERSÃO DESATUALIZADA.');
    console.log('ATUALIZANDO VERSÃO PARA ' + execute(`npm show ${engine} version`).split('\n')[0]);
    execute(`npm install ${engine}@${remote_version}`);
  }else{
    console.log('JÁ ESTÁ COM A ÚLTIMA VERSÃO.');
  }
}

let platform = os.platform();

if (platform === 'linux') {
  console.log("you are on a Linux os");
  update_last_version("whatsapp-web.js", 2);
}else if(platform === 'win32'){
  console.log("you are on a Windows os")
}else{
  console.log("unknown os")
}

// Express app setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origins: ["*"],
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    credentials: true
  },
  allowEIO3: true
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({storage: storage});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('static'));
express.static(path.join(__dirname, '/static'));
app.use('/static', express.static('static'))
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket IO
io.on('connection', socket => {
  console.log(`ID: ${socket.id} socket in`);

  socket.on('event', data => {
    console.log(data);
  });

  socket.on('disconnect', () => {
    console.log(`ID: ${socket.id} socket out`);
  });
});

// Main route
app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/templates/index.html')));

app.post('/start', async (req, res) => {
  const {session} = req.body;
  if (client) {
    await client.destroy();
    console.log("Restart client...");
  }
  client = new Client({
    authStrategy: new LocalAuth({dataPath: `${PROFILES}/${session}`}),
    puppeteer: {
      headless: true,
      handleSIGINT: false,
      args: [
        '--disable-web-security',
        '--no-sandbox',
        '--disable-web-security',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
      ],
    }
  });

  client.on('qr', (qr) => {
    console.log('QR code received!', qr);
    qrcode.toDataURL(qr, (err, url) => {
      req.io.emit('qrCode', {
        data: url,
        session
      });
    });
  });

  client.on('ready', () => {
    req.io.emit('ready', 'WhatsApp is ready!');
    req.io.emit('message', 'WhatsApp is ready!');
  });

  client.on('authenticated', () => {
    req.io.emit('authenticated', 'WhatsApp is authenticated!');
    req.io.emit('message', 'WhatsApp is authenticated!');
  });

  client.on('auth_failure', () => {
    req.io.emit('message', 'Auth failure, restarting session...');
  });

  client.on('disconnected', (reason) => {
    req.io.emit('message', 'WhatsApp is disconnected!');
    console.log(reason);
    client.destroy();
    client.initialize();
  });

  try {
    await client.initialize();
    res.status(200).json({
      result: 200,
      status: 'CONNECTED',
      response: `Session ${session} activated successfully!!!`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: 500,
      status: 'ERROR',
      response: 'Unable to activate session.'
    });
  }
});

// Middleware to validate required parameters
function validateParams(req, res, next) {
  const {number, text, path} = req.body;
  if (!number) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required.",
    });
  }
  if (!text && !path) {
    return res.status(400).json({
      success: false,
      message: "Either text or path is required.",
    });
  }
  next();
}

// Helper function to format number parameter
function formatNumber(number) {
  const isGroup = number.indexOf("-") > -1;
  return isGroup ? number : `${number}@c.us`;
}

// Routes
app.get("/api/v1/sendtext", async (req, res) => {
  const {number, text} = req.query;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  try {
    const response = await client.sendMessage(formattedNumber, Buffer.from(text, 'utf-8').toString());
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send files by upload
app.post("/api/v1/upload", upload.single('file'), async (req, res) => {
  const {number, caption} = req.body;
  const path = (__dirname + "/uploads/" + req.file.originalname);
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  try {
    const media = MessageMedia.fromFilePath(path);
    const response = await client.sendMessage(formattedNumber, media, {caption: caption});
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send text
app.post("/api/v1/sendtext", validateParams, async (req, res) => {
  const {number, text} = req.body;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  try {
    const response = await client.sendMessage(formattedNumber, text);
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send file
app.post('/api/v1/sendfile', validateParams, async (req, res) => {
  const {number, path, caption} = req.body;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  if (!path) {
    return res.status(400).json({
      success: false,
      message: "The file path was not provided.",
    });
  }
  try {
    const media = MessageMedia.fromFilePath(path);
    const response = await client.sendMessage(formattedNumber, media, {caption: caption});
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send image url
app.post("/api/v1/sendimageurl", validateParams, async (req, res) => {
  const {number, imageUrl, caption} = req.body;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  try {
    const media = await MessageMedia.fromUrl(imageUrl);
    const response = await client.sendMessage(formattedNumber, media, {caption: caption});
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send video
app.post("/api/v1/sendvideo", validateParams, async (req, res) => {
  const {number, path, caption} = req.body;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  try {
    const media = MessageMedia.fromFilePath(path);
    const response = await client.sendMessage(formattedNumber, media, {caption: caption});
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send location
app.post("/api/v1/sendlocation", validateParams, async (req, res) => {
  const {number, latitude, longitude, address} = req.body;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Latitude and longitude are required.",
    });
  }
  try {
    const location = new Location(latitude, longitude, address);
    const response = await client.sendMessage(formattedNumber, location);
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send voice
app.post("/api/v1/sendvoice", validateParams, async (req, res) => {
  const {number, path} = req.body;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  if (!path) {
    return res.status(400).json({
      success: false,
      message: "Path to audio file is required.",
    });
  }
  try {
    const media = MessageMedia.fromFilePath(path);
    const response = await client.sendMessage(formattedNumber, media);
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// Method POST to send vcard
app.post("/api/v1/sendvcard", validateParams, async (req, res) => {
  const {number, vcard} = req.body;
  const formattedNumber = formatNumber(number);
  const profile = await client.isRegisteredUser(formattedNumber);
  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "The phone number is not registered on WhatsApp.",
    });
  }
  try {
    const contact = new Contact(vcard);
    const response = await client.sendMessage(formattedNumber, contact);
    res.status(200).json({success: true, response});
  } catch (err) {
    res.status(500).json({success: false, message: err.message});
  }
});

// start server
server.listen(PORT, HOST, () => {
  console.log(`Servidor iniciado em http://${HOST}:${PORT}`);
});

//Closing correcily using CTRL+C
process.on('SIGINT', async () => {
  console.log('(SIGINT) Shutting down...');
  await client.destroy();
  console.log('client destroyed');
  process.exit(0);
});
