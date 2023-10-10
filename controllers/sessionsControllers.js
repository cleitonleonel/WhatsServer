const urlExists = require('url-exists');
const fs = require("fs");

class Sessions {

  static session = [];

  static checkPath(path) {
    urlExists(path, (error, exists) => {
      return !!exists;
    })
  }

  // checar ou adiciona um usuario na sessão
  static checkAddUser(session_name) {
    let checkFilter = this.session.filter(order => (order.session === session_name)), add = null;
    if (!checkFilter.length) {
      add = {
        session: session_name,
      }
      this.session.push(add)
      return true
    }
    return false
  }

  // checar se existe o usuario na sessão
  static checkSession(session_name) {
    const checkFilter = this.session.filter(order => (order.session === session_name));
    return !!checkFilter.length;
  }

  // pegar index da sessão (chave)
  static getSessionKey(session_name) {
    if (this.checkSession(session_name)) {
      for (const i in this.session) {
        if (this.session[i].session === session_name) {
          return i
        }
      }
    }
    return false
  }

  // adicionar informações a sessão
  static addInfoSession(session_name, extend) {
    if (this.checkSession(session_name)) {
      for (const i in this.session) {
        if (this.session[i].session === session_name) {
          const new_object = Object.assign(this.session[i], extend);
          return true
        }
      }
    }
    return false
  }

  // Remove object na sessão
  static removeInfoObjects(session_name, key) {
    if (this.checkSession(session_name)) {
      for (const i in this.session) {
        if (this.session[i].session === session_name) {
          delete this.session[i][key]
          return true
        }
      }
    }
    return false
  }

  // deletar sessão
  static async deleteSession(client, session_name) {
    if (this.checkSession(session_name)) {
      const key = this.getSessionKey(session_name);
      delete this.session[key];
      while (client.pupBrowser.isConnected()) {
        console.log("Aguardando o fechamento do Browser...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      this.removeProfileBySessionName(client, session_name);
      return true
    }
    return false
  }

  // retornar sessão
  static getSession(session_name) {
    if (this.checkSession(session_name)) {
      const key = this.getSessionKey(session_name);
      return this.session[key]
    }
    return false
  }

  // retornar todas
  static getAll() {
    return this.session
  }

  // checa o client
  static verifyClient(session_name) {
    return !!(this.getSession(session_name) && this.getSession(session_name).client);
  }

  static saveClient(client, session_name) {
    let serializedClients;
    try {
      const existingData = fs.readFileSync('clients.json', 'utf-8');
      serializedClients = JSON.parse(existingData);
    } catch (error) {
      serializedClients = [];
    }
    const sessionExists = serializedClients.some(clientData => clientData.session_name === session_name);
    if (!sessionExists) {
      const newClientData = {
        userDataDir: client.options.authStrategy.dataPath,
        session_name: session_name,
      };
      serializedClients.push(newClientData);
      fs.writeFileSync('clients.json', JSON.stringify(serializedClients, null, 2));
    }
  }

  static loadClients() {
    try {
      const serializedClients = JSON.parse(fs.readFileSync('clients.json', 'utf-8'));
      return serializedClients.map(({session_name, session}) => ({
        session_name,
        session,
      }));
    } catch (error) {
      return [];
    }
  }

  static checkClient(session_name) {
    let serializedClients;
    try {
      const existingData = fs.readFileSync('clients.json', 'utf-8');
      serializedClients = JSON.parse(existingData);
    } catch (error) {
      serializedClients = [];
    }
    return serializedClients.some(clientData => clientData.session_name === session_name);
  }

  static removeProfileBySessionName(client, session_name) {
    const existingData = fs.readFileSync('clients.json', 'utf-8');
    let userDataDir = client.options.authStrategy.dataPath;
    let serializedClients = JSON.parse(existingData);
    serializedClients = serializedClients.filter(profile => profile.session_name !== session_name);
    fs.writeFileSync('clients.json', JSON.stringify(serializedClients, null, 2));
    console.log(`O Browser está fechado ?: ${!client.pupBrowser.isConnected() ? "SIM" : "NÃO"}`);
    if (fs.existsSync(userDataDir)) {
      console.log(`Excluindo diretório do perfil: ${userDataDir}`);
      fs.rm(userDataDir, {recursive: true}, (err) => {
        if (err) {
          console.error(`Erro ao excluir diretório: ${err.message}`);
        } else {
          console.log(`Diretório excluído com sucesso: ${userDataDir}`);
        }
      });
    } else {
      console.log(`O diretório do perfil não existe: ${userDataDir}`);
    }
  }
}

module.exports = Sessions;
