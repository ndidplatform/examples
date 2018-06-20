const socket = io('/');

function disableButton(create) {
  document.getElementById('createNewIdentity').disabled = true;
  document.getElementById('addAccessor').disabled = true;
  if(create) document.getElementById('createNewIdentity').innerHTML = 'Creating...';
  else document.getElementById('addAccessor').innerHTML = 'Adding...';
}

function enableButton() {
  document.getElementById('createNewIdentity').disabled = false;
  document.getElementById('addAccessor').disabled = false;
  document.getElementById('createNewIdentity').innerHTML = 'Create New Identity';
  document.getElementById('addAccessor').innerHTML = 'Add Accessor';
}

function createSuccess(namespace, identifier) {
  alert('Identity created');
  window.location = '/home/' + namespace + '/' + identifier;
}

function createNewIdentity() {
  disableButton(true);
  let namespace = document.getElementById('namespaceNew').value;
  let identifier = document.getElementById('identifierNew').value;

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
      if (!exist) createSuccess(namespace, identifier);
      else {

        document.getElementById('createNewIdentity').innerHTML =
          'Waiting for consent at requestID: ' + request_id.toString().substr(0,8) + '...';

        //open eventlistener wait for redirected
        socket.on('onboardResponse', (request) => {
          if (request.request_id !== request_id) return;
          if (request.success) createSuccess(namespace, identifier);
          else {
            alert('Cannot create identity: ' + request.reason);
            enableButton();
          }
        });

      }
    } else {
      alert('Cannot create identity: Request ID is missing');
      enableButton();
    }
  })
  .catch((error) => {
    error.json().then((errorMessage) => window.alert(errorMessage));
    enableButton();
  });
}

function addAccessor() {
  disableButton(false);
  let namespace = document.getElementById('namespaceAdd').value;
  let identifier = document.getElementById('identifierAdd').value;

  fetch('/accessors', {
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
  .then(({ request_id }) => {
    if (request_id) {
      document.getElementById('addAccessor').innerHTML =
        'Waiting for consent at requestID: ' + request_id.toString().substr(0,8) + '...';

      socket.on('accessorResponse', (request) => {
        if (request.request_id !== request_id) return;
        if (request.success) alert('Accessor added.');
        else {
          alert('Cannot add accessor: ' + request.reason);
          enableButton();
        }
      });

    } else {
      alert('Cannot add accessor: Request ID is missing');
      enableButton();
    }
  })
  .catch((error) => {
    error.json().then((errorMessage) => window.alert(errorMessage));
    enableButton();
  });
}

window.onload = function() {
  document
    .getElementById('createNewIdentity')
    .addEventListener('click', createNewIdentity);

    document
    .getElementById('addAccessor')
    .addEventListener('click', addAccessor);
};
