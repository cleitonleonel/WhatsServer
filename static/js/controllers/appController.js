/* jshint esversion: 11 */

const server = window.location.protocol + "//" + window.location.host;
const loadingOverlay = document.getElementById('loading-overlay');
const api_token = ``;
const wh_connect = ``;
const wh_message = ``;
const wh_status = ``;
const wh_qrcode = ``;
let socket;

try {
  socket = io(`${server}`, {
    withCredentials: false,
  });
} catch (error) {
  console.log('API Desconectada!!!');
}

function start() {
  $('#form_modal').modal('hide');
  let session = document.getElementById('session_name').value;
  let URL = `${server}/api/v1/start`;

  socket.on(`whatsapp-status`, (status) => {
    if (status) {
      document.getElementById('buttonStart').disabled = true;
      loadingOverlay.style.display = 'none';
      document.getElementById('base64').src = "/img/ok.jpg";
      document.getElementById("desc_info").innerHTML = "Teste nosso envio de mensagens clicando no botão abaixo...";
      document.getElementById('action_button').innerHTML = '<button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#sendtext_modal"> Testar</button>';
    } else {
      document.getElementById('buttonStart').disabled = false;
      document.getElementById('base64').src = "/img/error.jpg";
    }
    try {
      console.log(status);
    } catch (error) {
      console.log('API Desconectada!!!');
    }
  });

  socket.on('qrCode', (qrCode) => {
    console.log(qrCode);
    console.log(qrCode.session, session);
    if (qrCode.session === session) {
      document.getElementById('base64').src = qrCode?.data;
      loadingOverlay.style.display = 'none';
    }
  });

  socket.on('message', function (msg) {
    // $('.logs').prepend($('<li>').text(msg));
  });

  socket.on('ready', function (data) {
    document.getElementById('buttonStart').disabled = true;
  });

  socket.on('authenticated', function (data) {
    loadingOverlay.style.display = 'none';
    document.getElementById('base64').src = "/img/ok.jpg";
    document.getElementById("desc_info").innerHTML = "Teste nosso envio de mensagens clicando no botão abaixo...";
    document.getElementById('action_button').innerHTML = '<button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#sendtext_modal"> Testar</button>';
    notification('Whatsapp Aberto com sucesso!!!', null, null, 'success');
  });

  loadingOverlay.style.display = 'flex';
  axios.post(`${URL}`, {
    session: session || '',
    wh_connect: wh_connect || '',
    wh_message: wh_message || '',
    wh_status: wh_status || '',
    wh_qrcode: wh_qrcode || '',
  })
    .then((data) => {
      if (data.status === "CONNECTED") {
        document.getElementById('buttonStart').disabled = true;
        loadingOverlay.style.display = 'none';
        notification('Whatsapp Aberto com sucesso!!!', null, null, 'success');
        document.getElementById('base64').src = "/img/ok.jpg";
        document.getElementById("desc_info").innerHTML = "Teste nosso envio de mensagens clicando no botão abaixo...";
        document.getElementById('action_button').innerHTML = '<button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#sendtext_modal"> Testar</button>';
      } else if (data.status === "QRCODE") {
        notification('Aguardando leitura de Qrcode', null, null, 'warning');
      }
      loadingOverlay.style.display = 'none';
    })
    .catch((error) => {
      loadingOverlay.style.display = 'none';
    });
}

function send_text() {
  let session = document.getElementById('session_name').value;
  let number = document.getElementById('number').value;
  let message = document.getElementById('message').value;
  let fileInput = document.getElementById('file');
  let file = fileInput.files[0];
  let payload;

  if (file) {
    payload = new FormData();
    payload.append('file', file);
    payload.append('session', session || '');
    payload.append('number', `55${number}` || '');
    payload.append('caption', message || '');
  } else {
    payload = {
      session: session || '',
      number: `55${number}` || '',
      text: message || '',
    };
  }

  axios.post(`${server}/api/v1/${file ? 'upload' : 'sendtext'}`, payload)
    .then(() => {
      $('#sendtext_modal').modal('hide');
      fileInput.value = '';
      notification('Mensagem enviada com sucesso!!!', null, null, 'success');
    })
    .catch((error) => {
      $('#sendtext_modal').modal('hide');
      notification('Tente novamente em instantes... \n' + JSON.stringify(error.message), null, null, 'warning');
      document.getElementById("number").focus();
    });
}

function notification(text, callback, close_callback, style) {
  Notify(text, callback, close_callback, style);
}
