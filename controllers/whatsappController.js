const {Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrcodeBase64 = require('qrcode');
const Sessions = require('../controllers/sessionsControllers');
const PROFILES = process.env.PROFILES || '.whats_profiles';

class WhatsappWebJS {
  static async start(req, res, session) {
    return new Promise(async (resolve, reject) => {
      try {
        let client;
        let useHere = false;
        if (useHere) {
          useHere = false;
        } else {
          if (!useHere) {
            useHere = true;
          }
        }
        console.log(`****** STARTING SESSION ${session} ******`);
        client = new Client({
          restartOnAuthFail: true,
          takeoverOnConflict: useHere,
          webVersion: '2.2404.1',
          authStrategy: new LocalAuth({
            dataPath: `${PROFILES}/${session}`
          }),
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
              '--disable-features=LeakyPeeker',
              '--disable-setuid-sandbox',
              '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
            ],
          },
        });

        client.initialize();
        Sessions.addInfoSession(session, {
          session: session,
          client: client
        });

        client.on('qr', (qr) => {
          console.log('QR code received!', qr);
          //qrcode.generate(qr, { small: true });
          qrcodeBase64.toDataURL(qr, (err, url) => {
            Sessions.addInfoSession(session, {
              qrCode: url,
              status: 'QRCODE'
            });
            req.io.emit('qrCode', {
              data: url,
              session
            });
          });
          resolve(session);
        });

        client.on('ready', () => {
          console.log('READY... WhatsApp is ready');
          req.io.emit('ready', 'WhatsApp is ready!');
          req.io.emit('message', 'WhatsApp is ready!');
        });

        client.on('auth_failure', () => {
          console.log('Auth failure, restarting...');
          req.io.emit('message', 'Auth failure, restarting session...');
        });

        client.on('disconnected', async (reason) => {
          console.log('Whatsapp is disconnected!');
          req.io.emit('message', 'WhatsApp is disconnected!');
          await client.destroy();
          //await client.logout();
          await Sessions.deleteSession(client, session);
          //await client.pupBrowser.close();
          //client.initialize();
        });

        client.on('change_state', (reason) => {
          console.log('Client was change state', reason);
          // client.resetState();
        });

        client.on('change_battery', (batteryInfo) => {
          const {battery, plugged} = batteryInfo;
          console.log(`Battery: ${battery}% - Charging? ${plugged}`);
        });

        client.on('authenticated', () => {
          console.log("Authenticated!!!");
          req.io.emit('authenticated', 'WhatsApp is authenticated!');
          req.io.emit('message', 'WhatsApp is authenticated!');
          Sessions.addInfoSession(session, {
            status: 'CONNECTED'
          });
          Sessions.saveClient(client, session);
          resolve(session);
        });

        client.on('message', async message => {
          //console.log(message.body);
          //req.io.emit('message', message.body);
        });

      } catch (error) {
        reject(error);
        console.log(error);
      }
    });
  }
}

//Closing correcily using CTRL+C
process.on('SIGINT', async () => {
  console.log('(SIGINT) Shutting down...');
  let sessions = Sessions.getAll();
  for (let i=0; i < sessions.length; i++) {
    if (sessions[i].client) {
      await sessions[i].client.destroy();
      console.log(`client ${sessions[i].session} destroyed`);
    }
  }
  process.exit(0);
});

module.exports = WhatsappWebJS;
