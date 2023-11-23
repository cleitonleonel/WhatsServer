const {MessageMedia, Location, Contact} = require('whatsapp-web.js');
const Manager = require('./managerControllers');
const Sessions = require('./sessionsControllers');
const WhatsappWebJS = require('./whatsappController');
const path = require('path');

function formatNumber(number) {
  const isGroup = number.indexOf("-") > -1;
  return isGroup ? number : `${number}@c.us`;
}

module.exports = {
  getIndex: (req, res) => {
    res.sendFile(path.join(__dirname, '../templates', 'index.html'));
  },

  startSession: async (req, res) => {
    const {session} = req.body;
    const sessionExists = Sessions.checkSession(session);
    if (!sessionExists) {
      await init(session);
    }

    if (sessionExists) {
      const sessionData = Sessions.getSession(session);
      if (sessionData.status === 'QRCODE' || sessionData.status === 'READY') {
          await init(session);
      } else if (sessionData) {
        return res.status(200).json({
          result: 200,
          status: "FAIL",
          reason: "There is already a session with that name",
        });
      }
    }

    async function init(session) {
      Sessions.checkAddUser(session);
      Sessions.addInfoSession(session, {});
      try {
        await WhatsappWebJS.start(req, res, session);
        let data = Sessions.getSession(session);
        if(data.status === "CONNECTED") {
          res.status(200).json({
            result: 200,
            status: 'CONNECTED',
            response: `Session ${session} activated successfully!!!`
          });
        } else {
          res.status(200).json({
            result: 200,
            status: data.status,
            response: `Session ${session} awaiting qrcode!!!`
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          result: 500,
          status: 'ERROR',
          response: 'Unable to activate session.'
        });
      }
    }
  },

  closeSession: async  (req, res) => {
    let {session} = req.body.session;
    let data = Sessions.getSession(session);
    try {
      await data.client.close();
      res.status(200).json({
        status: true,
        message: "Sessão Fechada com sucesso"
      });
    } catch (error) {
      res.status(400).json({
        status: false,
        message: "Error ao fechar sessão", error
      });
    }
  },

  logoutSession: async  (req, res) => {
    let {session} = req.body.session;
    let data = Sessions.getSession(session);
    try {
      await data.client.logout();
      res.status(200).json({
        status: true,
        message: "Sessão Fechada com sucesso"
      });
    } catch (error) {
      res.status(400).json({
        status: false,
        message: "Error ao fechar sessão", error
      });
    }
  },

  getQrcode: async (req, res) => {
    const {session} = req.body;
    let data = Sessions.getSession(session);
    if (!session) {
      return res.status(401).json({
        success: false,
        "result": 401,
        "messages": "Não autorizado, verifique se o nome da sessão esta correto"
      })
    } else {
      try {
        let img = Buffer.from(data.qrCode.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': img.length
        });
        res.end(img);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Error ao recuperar QRCode !"
        });
      }
    }
  },

  getClients: async (req, res) => {
    try {
      let clients = Sessions.loadClients();
      res.status(200).json({success: true, clients});
    } catch (err) {
      res.status(500).json({success: false, message: err.message});
    }
  },

  checkExists: async (req, res) => {
    const {session} = req.body;
    try {
      let response = Sessions.checkClient(session);
      let isActive = Sessions.verifyClient(session);
      res.status(200).json({success: true, is_active: isActive, response});
    } catch (err) {
      res.status(500).json({success: false, is_active: false, message: err.message});
    }
  },

  getSendText: async (req, res) => {
    const {number, text, session} = req.query;
    const data = Sessions.getSession(session);
    const formattedNumber = formatNumber(number);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: "The phone number is not registered on WhatsApp.",
        });
      }
      try {
        const response = await data.client.sendMessage(formattedNumber, Buffer.from(text, 'utf-8').toString());
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }

  },

  postSendText: async (req, res) => {
    const {number, text, session} = req.body;
    const data = Sessions.getSession(session);
    const formattedNumber = formatNumber(number);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: "The phone number is not registered on WhatsApp.",
        });
      }
      try {
        const response = await data.client.sendMessage(formattedNumber, text);
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }

  },

  sendFile: async (req, res) => {
    const {number, path, caption, session} = req.body;
    const data = Sessions.getSession(session);
    const formattedNumber = formatNumber(number);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
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
        const response = await data.client.sendMessage(formattedNumber, media, {caption: caption});
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }
  },

  uploadFile: async (req, res) => {
    const {number, caption, session} = req.body;
    const file_paths = req.files;
    const data = Sessions.getSession(session);
    const formattedNumber = formatNumber(number);
    let response;
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: "The phone number is not registered on WhatsApp.",
        });
      }
      try {
        for (let i = 0; i < file_paths.length; i++) {
          const file_path = file_paths[i];
          const filepath = path.join(__dirname, '../uploads', file_path.originalname);
          const media = MessageMedia.fromFilePath(filepath);
          if (i === file_paths.length - 1) {
            response = await data.client.sendMessage(formattedNumber, media, {caption: caption});
          } else {
            response = await data.client.sendMessage(formattedNumber, media);
          }
          await Manager.deleteFile(filepath);
        }
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }
  },

  // Method POST to send image url
  sendImageUrl: async (req, res) => {
    const {number, imageUrl, caption, session} = req.body;
    const formattedNumber = formatNumber(number);
    const data = Sessions.getSession(session);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: "The phone number is not registered on WhatsApp.",
        });
      }
      try {
        const media = await MessageMedia.fromUrl(imageUrl);
        const response = await data.client.sendMessage(formattedNumber, media, {caption: caption});
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }
  },

  // Method POST to send video
  sendVideo: async (req, res) => {
    const {number, path, caption, session} = req.body;
    const formattedNumber = formatNumber(number);
    const data = Sessions.getSession(session);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: "The phone number is not registered on WhatsApp.",
        });
      }
      try {
        const media = MessageMedia.fromFilePath(path);
        const response = await data.client.sendMessage(formattedNumber, media, {caption: caption});
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }
  },

  // Method POST to send location
  sendLocation: async (req, res) => {
    const {number, latitude, longitude, address, session} = req.body;
    const formattedNumber = formatNumber(number);
    const data = Sessions.getSession(session);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
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
        const response = await data.client.sendMessage(formattedNumber, location);
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }
  },

  // Method POST to send voice
  sendVoice: async (req, res) => {
    const {number, path, session} = req.body;
    const formattedNumber = formatNumber(number);
    const data = Sessions.getSession(session);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
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
        const response = await data.client.sendMessage(formattedNumber, media);
        res.status(200).json({success: true, response});
      } catch (err) {
        res.status(500).json({success: false, message: err.message});
      }
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }
  },

  // Method POST to send vcard
  sendVcard: async (req, res) => {
    const {number, vcard, session} = req.body;
    const formattedNumber = formatNumber(number);
    const data = Sessions.getSession(session);
    if (data) {
      const profile = await data.client.isRegisteredUser(formattedNumber);
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
    } else {
      res.status(200).json({success: false, message: "Nenhuma sessão encontrada."});
    }
  },
};
