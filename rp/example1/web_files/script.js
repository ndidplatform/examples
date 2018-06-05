//const socket = io('http://localhost:8080');
const socket = io('/');

let requestId = null;
let referenceId = null;
let verified = false;

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
verifyWithMockDataButton.addEventListener('click', (event) =>
  sendVerifyRequest(true)
);

const idpResponseCount = document.getElementById('idp-response-count');
const asResponse = document.getElementById('as-response');
const asResponseCount = document.getElementById('as-response-count');

let needData = false;
let gotData = false;
let allDataSigned = false;
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
  gotData = false;
  allDataSigned = false;
  if (!needData) {
    asResponse.classList.add('d-none');
  }
  verifyButton.textContent = 'Requesting...';
  if (withMockData) verifyButton.disabled = true;
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
      withMockData,
      request_timeout: document.getElementById('timeout').value,
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
    .catch((error) => {
      error.json().then((errorMessage) => window.alert(errorMessage));
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

socket.on('request_event', (event) => {
  if (event.referenceId == referenceId) {
    idpResponseCount.textContent = `${event.answered_idp_count}/${
      event.min_idp
    }`;
    asResponseCount.innerHTML = event.service_list.reduce(
      (HtmlString, service) => {
        return (
          HtmlString +
          `<div>${service.service_id}: ${service.answered_count}/${
            service.count
          }</div>`
        );
      },
      ''
    );
    if (event.status === 'completed' && event.service_list.length > 0) {
      allDataSigned = true;

      if (gotData) {
        dataStatusElement.textContent = 'Data Received and Signed by AS!';
        dataCircleLoader.classList.add('load-complete');
        dataLoaderCheckmark.classList.add('draw');
        dataLoaderCheckmark.style = 'display:block;';
      }
    }
    if (
      event.status === 'completed' ||
      (event.status === 'confirmed' &&
        event.min_idp === event.answered_idp_count)
    ) {
      statusElement.textContent = 'Verification Successful!';
      circleLoader.classList.add('load-complete');
      loaderCheckmark.classList.add('draw');
      loaderCheckmark.style = 'display:block;';
      verified = true;

      if (needData) {
        step3.classList.remove('d-none');
        dataStatusElement.textContent = 'Waiting for data...';
      }
    } else if (event.status === 'rejected') {
      statusElement.textContent = 'Verification Rejected!';
      circleLoader.classList.add('load-error');
      loaderCheckmark.classList.add('error');
      loaderCheckmark.style = 'display:block;';
    }
  }
});

socket.on('invalid', (data) => {
  if (data.referenceId == referenceId) {
    statusElement.textContent = 'Verification Failed!';
    circleLoader.classList.add('load-error');
    loaderCheckmark.classList.add('error');
    loaderCheckmark.style = 'display:block;';
  }
});

function requestClosed(timeout) {
  if (!verified) {
    statusElement.textContent = timeout
      ? 'Verification Timeout!'
      : 'This request was manually closed.';
    circleLoader.classList.add('load-error');
    loaderCheckmark.classList.add('error');
    loaderCheckmark.style = 'display:block;';
  } else {
    dataStatusElement.textContent = timeout
      ? 'Data request Timeout!'
      : 'This request was manually closed.';
    dataCircleLoader.classList.add('load-error');
    dataLoaderCheckmark.classList.add('error');
    dataLoaderCheckmark.style = 'display:block;';
    dataDisplay.textContent = JSON.stringify('Did not received data in time.');
  }
}

socket.on('closed', (data) => {
  if (data.referenceId == referenceId) {
    requestClosed(false);
  }
});

socket.on('timeout', (data) => {
  if (data.referenceId == referenceId) {
    requestClosed(true);
  }
});

socket.on('dataFromAS', (data) => {
  if (data.referenceId == referenceId) {
    gotData = true;
    needData = false;

    if (allDataSigned) {
      dataStatusElement.textContent = 'Data Received and Signed by AS!';
      dataCircleLoader.classList.add('load-complete');
      dataLoaderCheckmark.classList.add('draw');
      dataLoaderCheckmark.style = 'display:block;';
    }
    console.log(data.dataFromAS);
    for(let i = 0 ; i < data.dataFromAS.length ; i++) {
      //too long to display
      delete data.dataFromAS[i].source_signature;
    }
    dataDisplay.textContent = JSON.stringify(data.dataFromAS);
  }
});
