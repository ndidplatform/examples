const socket = io('/');

function createNewIdentity() {
  document.getElementById('createNewIdentity').disabled = true;
  document.getElementById('createNewIdentity').innerHTML = 'Creating...';
  let namespace = document.getElementById('namespace').value;
  let identifier = document.getElementById('identifier').value;
  fetch('/identity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      namespace,
      identifier,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    })
    .then(({ request_id, exist }) => {
      if (request_id) {
        if (!exist) {
          alert('Identity created');
          window.location = '/home/' + namespace + '/' + identifier;
        } else {
          //alert('Please consent to request: ' + request_id);
          document.getElementById('createNewIdentity').innerHTML =
            'Waiting for consent at requestID: ' + request_id.toString();
          //open eventlistener wait for redirected
          socket.on('onboardResponse', (request) => {
            if (request.request_id !== request_id) return;
            if (request.success) {
              alert('Identity created');
              window.location = '/home/' + namespace + '/' + identifier;
            } else {
              alert('Cannot create identity: ' + request.reason);
              document.getElementById('createNewIdentity').disabled = false;
              document.getElementById('createNewIdentity').innerHTML = 'Create';
            }
          });
        }
      } else {
        alert('Cannot create identity: Request ID is missing');
        document.getElementById('createNewIdentity').disabled = false;
        document.getElementById('createNewIdentity').innerHTML = 'Create';
      }
    })
    .catch((error) => {
      error.json().then((errorMessage) => window.alert(errorMessage));
      document.getElementById('createNewIdentity').disabled = false;
      document.getElementById('createNewIdentity').innerHTML = 'Create';
    });
}
window.onload = function() {
  document
    .getElementById('createNewIdentity')
    .addEventListener('click', createNewIdentity);
};
