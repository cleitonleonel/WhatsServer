const fs = require('fs');
const exec = require("child_process");

function execute(command) {
  let version = exec.execSync(command);
  return version.toString();
}

class Manager {
  static updateVersion (engine, sector) {
    //let remote_version = execute(`npm show ${engine} version`);
    //let local_version = execute(`npm list -l --depth=0 | awk -F@ '/${engine.split("/")[0]}/ { print $${sector}}'`);
    let local_version = execute("cat ./node_modules/whatsapp-web.js/package.json | grep -oP '\"version\": \"\\K[^\"]+'");
    let remote_version = execute("curl -s https://raw.githubusercontent.com/cleitonleonel/whatsweb.js/main/package.json  | jq -r '.version'");
    console.log(`ENGINE: ${engine} \n\nVERSÃO_LOCAL: ${local_version}VERSÃO_REMOTA: ${remote_version}`)
    if (parseInt(local_version.split('\n')[0].split('.').join('')) < parseInt(remote_version.split('\n')[0].split('.').join(''))) {
      console.log('VERSÃO DESATUALIZADA.');
      //console.log('ATUALIZANDO VERSÃO PARA ' + execute(`npm show ${engine} version`).split('\n')[0]);
      console.log(`ATUALIZANDO VERSÃO PARA ${remote_version}`);
      //execute(`npm install ${engine}@${remote_version}`);
       execute("npm install https://github.com/cleitonleonel/whatsweb.js.git");
    }else{
      console.log('JÁ ESTÁ COM A ÚLTIMA VERSÃO.\n');
    }
  }

  static async deleteFile (filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static async deletePath (PathDir) {
    return new Promise((resolve, reject) => {
      fs.rmdir(PathDir, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = Manager;
