const socket = io('/');
let request_id, namespace, identifier;

/*var onevent = socket.onevent;
socket.onevent = function (packet) {
    var args = packet.data || [];
    onevent.call (this, packet);    // original call
    packet.data = ['*'].concat(args);
    onevent.call(this, packet);      // additional call to catch-all
};

socket.on('*',function(event,data) {
  console.log(event);
  console.log(data);
});*/

socket.on('onboardResponse', (request) => {
  if (request.request_id !== request_id) return;
  if (request.success) createSuccess(namespace, identifier);
  else {
    alert('Cannot create identity: ' + request.reason);
    enableButton();
  }
});

socket.on('accessorResponse', (request) => {
  console.log('accessorResponse');
  if (request.request_id !== request_id) return;
  if (request.success) alert('Accessor added.');
  else alert('Cannot add accessor: ' + request.reason);
  enableButton();
});

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
  namespace = document.getElementById('namespaceNew').value;
  identifier = document.getElementById('identifierNew').value;

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
  .then((result) => {
    if (result.request_id) {
      if (!result.exist) createSuccess(namespace, identifier);
      else {
        request_id = result.request_id;
        document.getElementById('createNewIdentity').innerHTML =
          'Waiting for consent at requestID: ' + request_id.toString().substr(0,8) + '...';
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
  .then((result) => {
    if (result.request_id) {
      request_id = result.request_id;
      document.getElementById('addAccessor').innerHTML =
        'Waiting for consent at requestID: ' + request_id.toString().substr(0,8) + '...';
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
