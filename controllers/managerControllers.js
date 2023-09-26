const fs = require('fs');
const exec = require("child_process");

function execute(command) {
  let version = exec.execSync(command);
  return version.toString();
}

class Manager {
  static updateVersion (engine, sector) {
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
}

module.exports = Manager;
