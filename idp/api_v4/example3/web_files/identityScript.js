const socket = io('/');
let request_id, namespace, identifier;

function handleWsMessage(data) {
  if (data.type === 'create_identity_request_result') {
    if (data.success) {
      if (!data.exist) createSuccess(namespace, identifier);
      else {
        request_id = data.request_id;
        document.getElementById('createNewIdentity').innerHTML =
          'Waiting for consent at requestID: ' +
          request_id.toString().substr(0, 8) +
          '...';
      }
    } else {
      alert(
        `Cannot create identity: ${data.error.message} (${data.error.code})`
      );
      enableButton();
    }
  } else if (data.type === 'create_identity_result') {
    if (data.request_id !== request_id) return;
    if (data.success) createSuccess(namespace, identifier);
    else {
      alert(
        `Cannot create identity: ${data.error.message} (${data.error.code})`
      );
      enableButton();
    }
  } else if (data.type === 'add_accessor_request_result') {
    if (data.success) {
      request_id = data.request_id;
      document.getElementById('addAccessor').innerHTML =
        'Waiting for consent at requestID: ' +
        request_id.toString().substr(0, 8) +
        '...';
    } else {
      alert(`Cannot add accessor: ${data.error.message} (${data.error.code})`);
      enableButton();
    }
  } else if (data.type === 'add_accessor_result') {
    console.log('accessorResponse');
    if (data.request_id !== request_id) return;
    if (data.success) alert('Accessor added');
    else
      alert(`Cannot add accessor: ${data.error.message} (${data.error.code})`);
    enableButton();
  } else {
    console.error('Unknown data type', data);
  }
}

socket.on('message', handleWsMessage);

function disableButton(create) {
  document.getElementById('createNewIdentity').disabled = true;
  document.getElementById('addAccessor').disabled = true;
  if (create)
    document.getElementById('createNewIdentity').innerHTML = 'Creating...';
  else document.getElementById('addAccessor').innerHTML = 'Adding...';
}

function enableButton() {
  document.getElementById('createNewIdentity').disabled = false;
  document.getElementById('addAccessor').disabled = false;
  document.getElementById('createNewIdentity').innerHTML =
    'Create New Identity';
  document.getElementById('addAccessor').innerHTML = 'Add Accessor';
}

function createSuccess(namespace, identifier) {
  alert('Identity created');
  window.location = '/home/' + namespace + '/' + identifier;
}

function createNewIdentity() {
  disableButton(true);
  namespace = document.getElementById('namespaceNew').value;
  identifier = document.getElementById('identifierNew').value;
  let mode = document.querySelector('input[name="mode"]:checked').value;

  fetch('/identity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      namespace,
      identifier,
      mode: parseInt(mode),
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    })
    .then((result) => console.log('create identity request', result))
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
    .then((result) => console.log('add accessor request', result))
    .catch((error) => {
      error.json().then((errorMessage) => window.alert(errorMessage));
      enableButton();
    });
}

window.onload = function() {
  document
    .getElementById('createNewIdentity')
    .addEventListener('click', createNewIdentity);

  document.getElementById('addAccessor').addEventListener('click', addAccessor);
};
