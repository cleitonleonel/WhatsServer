#!/bin/bash

sudo apt update -y
sudo apt upgrade -y
sudo apt install -y curl jq \
nano git gconf-service libasound2 \
libatk1.0-0 libc6 libcairo2 libcups2 \
libdbus-1-3 libexpat1 libfontconfig1 \
libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
libglib2.0-0 libgtk-3-0 libnspr4 \
libpango-1.0-0 libpangocairo-1.0-0 \
libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
libxcomposite1 libxcursor1 libxdamage1 \
libxext6 libxfixes3 libxi6 libxrandr2 \
libxrender1 libxss1 libxtst6 \
ca-certificates fonts-liberation \
libappindicator1 libnss3 lsb-release \
xdg-utils wget build-essential \
apt-transport-https libgbm-dev

node_version="--lts"
base_dir=$(pwd)
base_name=$(basename "${base_dir}")
username=$1
password=$2

os_version=$(lsb_release -rs)
. /etc/os-release

if (( $(echo "$os_version < 20.04" | bc -l) )); then
  node_version="16.15.1"
fi

echo "OLHA A VERSÃO DO SISTEMA: ${os_version}"
echo "OLHA A VERSÃO DO NODE: ${node_version}"
echo "OLHA O BASENAME: ${base_name}"

echo 'Criando usuário'
if [ $(id -u) -eq 0 ]; then
        grep "$username" /etc/passwd >/dev/null
        if [ $? -eq 0 ]; then
                echo "$username exists!"
        else
                sudo adduser --gecos "" --disabled-password "$username"
                echo "$username:$password" | sudo chpasswd
                [ $? -eq 0 ] && echo "Usuário adicionado ao sistema!" || echo "Falha ao adicionar usuário!"
        fi
else
        echo "Apenas o root pode adicionar um usuário ao sistema"
        exit 2
fi

echo 'Adicionando usuário ao sudoers'
sudo sh -c "echo '$username    ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers"

echo "Dando permissões ao usuário $username"
sudo chown "$username:$username" -R "/home/$username"
sudo chmod -R 755 "/home/$username"

cd "/home/$username" || exit
echo "$PWD"

su "$username" << EOF

if [ "$base_name" != "WhatsServer" ]; then
  git clone https://github.com/cleitonleonel/WhatsServer.git
fi

wget https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh -O nvm_install.sh
chmod  +x ./nvm_install.sh
./nvm_install.sh
rm -rf ./nvm_install.sh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

EOF

ssh -vT git@github.com

su - "$username" -c "bash -l -c 'export node_version=\"$node_version\" && echo USUÁRIO: \$USER && echo PATH: \$PWD && echo NODE_VERSION: \$node_version && source ~/.bashrc'"
su - "$username" -c "bash -l -c 'source ~/.nvm/nvm.sh && export PATH=\"\$PATH:/usr/bin:/bin:/usr/local/bin\" && source ~/.bashrc && export node_version=\"$node_version\" && nvm install \"\$node_version\"'"
su - "$username" -c "bash -l -c 'source ~/.nvm/nvm.sh && echo \$(node -v | sed \"s/v//\") > ~/WhatsServer/.nvmrc'"
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && nvm install-latest_npm"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && nvm use node"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && npm -v"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && npm install -g npm@latest"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && cd WhatsServer && npm install"'

service_content="[Unit]
Description=WhatsServer instance to serve $username
After=network.target

[Service]
User=$username
Group=$username
WorkingDirectory=/home/whatsserver/WhatsServer
ExecStart=/bin/bash -c 'source ~/.nvm/nvm.sh && nvm use $(cat /home/whatsserver/WhatsServer/.nvmrc) && node app.js'

[Install]
WantedBy=multi-user.target"

service_file="/etc/systemd/system/${username}.service"
echo "$service_content" | sudo tee "$service_file" > /dev/null

sudo systemctl daemon-reload
sudo systemctl enable "$username"
sudo systemctl start "$username"

sudo chown "$username:$username" -R "/home/$username"
sudo chmod -R 755 "/home/$username"
sudo chmod -R 777 "/home/$username/WhatsServer"

echo "Instalação concluída com sucesso!!!"

su - "$username"
