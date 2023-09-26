// Constants and dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const os = require("os");
const session = require('express-session');
const {Server} = require("socket.io");
const routes = require('./routes/routes');
const manager = require('./controllers/managerControllers');
const platform = os.platform();

if (platform === 'linux') {
  console.log("you are on a Linux os");
  manager.updateVersion("whatsapp-web.js", 2);
}else if(platform === 'win32'){
  console.log("you are on a Windows os");
}else{
  console.log("unknown os");
}

// Configuration
require('dotenv').config();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

// Express app setup
const app = express();

// Configurar o middleware de sessão
app.use(session({
  secret: 'seuSegredoAqui',
  resave: false,
  saveUninitialized: true
}));

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('static'));
express.static(path.join(__dirname, '/static'));
app.use('/static', express.static('static'));
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use('/', routes);

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

// start server
server.listen(PORT, HOST, () => {
  console.log(`Servidor iniciado em http://${HOST}:${PORT}`);
});

//Closing correcily using CTRL+C
process.on('SIGINT', async () => {
  console.log('(SIGINT) Shutting down...');
  if (app.client) {
    await app.client.destroy();
    console.log('client destroyed');
  }
  process.exit(0);
});
