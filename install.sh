apt update -y
apt upgrade -y
apt install -y git

diretorio_corrente=$(pwd)

if [ "$diretorio_corrente" != "$HOME/WhatsServer" ]; then
  git clone https://github.com/cleitonleonel/WhatsServer.git
  cd WhatsServer || exit
fi

wget https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh -O nvm_install.sh
chmod  +x ./nvm_install.sh
./nvm_install.sh
rm -rf ./nvm_install.sh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

source ~/.bashrc

nvm install --lts
nvm install-latest-npm

npm install
npm fund
