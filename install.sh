sudo apt update -y
sudo apt upgrade -y
sudo apt install -y git curl jq

base_dir=$(pwd)
base_name=$(basename "${base_dir}")
username=$1
password=$2

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

cd "/home/$username"
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

su - "$username" -c 'bash -l -c "echo USUÁRIO: $USER && echo PATH: $PWD && source ~/.bashrc"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && nvm install --lts"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && nvm install-latest_npm"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && nvm use node"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && npm -v"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && npm install -g npm@latest"'
su - "$username" -c 'bash -l -c "source ~/.nvm/nvm.sh && cd WhatsServer && npm install"'

echo "Instalação concluída com sucesso!!!"

su - "$username"
