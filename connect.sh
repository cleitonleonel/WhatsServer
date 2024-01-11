# Obtendo todos as sessões
curl "http://localhost:3333/api/v1/clients" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)"

# Verificando se a sessão existe
curl -X POST "http://localhost:3333/api/v1/check" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton"

# Startando uma sessão
curl -X POST "http://localhost:3333/api/v1/start" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton"

# Recuperando o qrcode e exibindo na tela com auxilio do fim
curl -X GET "http://localhost:3333/api/v1/qrcode" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton" \
    --output "qrcode.png" | fim -H qrcode.png


# Enviando uma mensagem de texto simples
curl -X POST "http://localhost:3333/api/v1/sendtext" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -d "session=cleiton" \
    -d "number=5527995772291" \
    -d "text=Olá"


# Enviando arquivos e assunto
curl -X POST "http://localhost:3333/api/v1/upload" \
    -H "User-Agent: Mozilla/5.0 (MSIE; Windows 10)" \
    -F "session=cleiton" \
    -F "caption=*Cleiton* Creton" \
    -F "number=5527995772291" \
    -F "file=@/home/cleiton/backup.ico"
