## _WhatsServer_

<img src="https://github.com/cleitonleonel/WhatsServer/blob/master/whats.png?raw=true" alt="whatsserver" width="200"/>

Server básico para pequenos projetos de automação do whatsapp usando [whatsapp-web.js](https://wwebjs.dev/),
para fins educativos.

### Instalação e uso

```shell
git clone https://github.com/cleitonleonel/WhatsServer.git
cd WhatsServer
sudo chmod +x ./install.sh
./install.sh
node app.js
```

```shell
# Verificando se a sessão existe
curl -X POST "http://localhost:3333/api/v1/check" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton"
```

```shell
# Startando uma sessão
curl -X POST "http://localhost:3333/api/v1/start" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton"
```

```shell
# Recuperando o qrcode e exibindo na tela com auxilio do fim
curl -X GET "http://localhost:3333/api/v1/qrcode" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton" \
    --output "qrcode.png" | fim -H qrcode.png
```

```shell
# Enviando uma mensagem de texto simples
curl -X POST "http://localhost:3333/api/v1/sendtext" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton" \
    -d "number=5527995772291" \
    -d "text=Olá"
```

```shell
# Enviando arquivos e assunto
curl -X POST "http://localhost:3333/api/v1/upload" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -F "session=cleiton" \
    -F "caption=*Cleiton* Creton" \
    -F "number=5527995772291" \
    -F "file=@/home/cleiton/backup.ico"
```

### Este projeto ajudou você?

Se esse projeto ajudar de alguma forma, sinta-se livre para me pagar um café, kkkk...Basta apontar a câmera do seu celular para um dos qrcodes abaixo.

<img src="https://github.com/cleitonleonel/pypix/blob/master/qrcode.png?raw=true" alt="QRCode Doação" width="250"/>

<img src="https://github.com/cleitonleonel/pypix/blob/master/artistic.gif?raw=true" alt="QRCode Doação" width="250"/>

### Author

Cleiton Leonel Creton ==> cleiton.leonel@gmail.com
