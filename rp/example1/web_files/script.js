//const socket = io('http://localhost:8080');
const socket = io('/');

let requestId = null;
let referenceId = null;

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

//const noSelectedIdpAlert = document.getElementById('noSelectedIdpAlert');

const requestIdElement = document.getElementById('requestId');
const referenceIdElement = document.getElementById('referenceId');
const statusElement = document.getElementById('status');
const dataStatusElement = document.getElementById('dataStatus');
const circleLoader = document.getElementsByClassName('circle-loader')[0];
const dataCircleLoader = document.getElementsByClassName('circle-loader')[1];
const loaderCheckmark = document.getElementsByClassName('checkmark')[0];
const dataLoaderCheckmark = document.getElementsByClassName('checkmark')[1];

const dataDisplay = document.getElementById('dataDisplay');
//const idpsElement = document.getElementById('idps');

const verifyButton = document.getElementById('verify');
verifyButton.addEventListener('click', (event) => sendVerifyRequest());

const verifyWithMockDataButton = document.getElementById('verifyWithMockData');
verifyWithMockDataButton.addEventListener('click', (event) => sendVerifyRequest(true));

let needData = false;
// const verifyHideSourceRpButton = document.getElementById('verifyHideSourceRp');
// verifyHideSourceRpButton.addEventListener('click', (event) => sendVerifyRequest(true));

/*window.addEventListener('load', () => {
  fetch('/idps')
    .then(response => {
      return response.json();
    })
    .then(json => {
      const idps = json.idps;
      const idpListItems = idps.map(idp => {
        const ele = `<div class="custom-control custom-checkbox">
          <input type="checkbox" class="custom-control-input" id="checkbox-${idp.id}" name="idp-${idp.id} data-id="${idp.id}>
          <label class="custom-control-label" for="checkbox-${idp.id}">${idp.name}</label>
        </div>`;
        return ele;
      });
      idpsElement.innerHTML = idpListItems.join('');
    });
});*/

function sendVerifyRequest(withMockData = false, hideSourceRp = false) {
  // const selectedIdpElements = Array.prototype.slice.call(document.querySelectorAll('#idps input'));
  // const selectedIdps = selectedIdpElements.filter(ele => ele.checked === true).map(ele => ele.dataset.id);

  //if (selectedIdps.length > 0) {
  
  // statusElement.style = '';
  needData = withMockData;
  verifyButton.textContent = 'Requesting...';
  if(withMockData) verifyButton.disabled = true;
  else verifyWithMockDataButton.disabled = true;

  fetch('/createRequest', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      namespace: document.getElementById('namespace').value,
      identifier: document.getElementById('identifier').value,
      withMockData
    }),
  })
    .then((response) => {
      if (response.status !== 200) {
        throw response;
      }
      return response.json();
    })
    .then((json) => {
      step1.classList.add('d-none');
      step2.classList.remove('d-none');
      statusElement.textContent = 'Waiting for your verification...';

      requestId = json.requestId;
      referenceId = json.referenceId;
      requestIdElement.textContent = 'Request ID: ' + requestId;
      referenceIdElement.textContent = 'Ref: ' + referenceId;
    })
    .catch ((error) => {
      window.alert('Error requesting identity verification');
    })
    .then(() => {
      verifyButton.textContent = 'Request Identity Verification';
      verifyButton.disabled = false;
      verifyWithMockDataButton.disabled = false;
    });
  /*} else {
    noSelectedIdpAlert.classList.remove('d-none');
  }*/
}

socket.on('success', (data) => {
  if (data.referenceId == referenceId) {
    statusElement.textContent = 'Verification Successful!';
    circleLoader.classList.add('load-complete');
    loaderCheckmark.classList.add('draw');
    loaderCheckmark.style = 'display:block;';

    if(needData) {
      step3.classList.remove('d-none')
      dataStatusElement.textContent = 'Waiting for data...';
    }
    
  }
});

socket.on('deny', (data) => {
  if (data.referenceId == referenceId) {
    statusElement.textContent = 'Verification Failed!';
    circleLoader.classList.add('load-error');
    loaderCheckmark.classList.add('error');
    loaderCheckmark.style = 'display:block;';
  }
});

socket.on('dataFromAS', (data) => {
  if (data.referenceId == referenceId) {
    dataStatusElement.textContent = 'Data Received!';
    dataCircleLoader.classList.add('load-complete');
    dataLoaderCheckmark.classList.add('draw');
    dataLoaderCheckmark.style = 'display:block;';
    dataDisplay.textContent = JSON.stringify(data.dataFromAS);
  }
});