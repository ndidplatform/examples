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
const idpResponses = document.getElementById('idp-responses');

const asResponse = document.getElementById('as-response');

let flowFinished = false;
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

const dataReqListCountInput = document.getElementById('data_req_list_count');
dataReqListCountInput.addEventListener('input', function (event) {
  updateDataReqListCount(this.value);
});

function updateDataReqListCount(count) {
  if (!isFinite(count) || count < 0) return;

  let innerHTML = '';
  for (let i = 0; i < count; i++) {
    innerHTML += `<li style="list-style:none;" id="data_req_list_item_${i}">
      Service ID: <input type="textbox" id="service_id_${i}" class="form-control" placeholder="e.g. bank_statement, 001.cust_info_001"></input>
      AS ID List: <input type="textbox" id="as_id_list_${i}" class="form-control" placeholder="e.g. as1, as2"></input>
      AS Needed: <input type="textbox" id="min_as_${i}" class="form-control"></input>
      Request Params: <input type="textbox" id="request_params_${i}" class="form-control"></input>
      ${i < count - 1 ? '<hr />' : ''}
      </li>`;
  }

  document.getElementById('data_req_list').innerHTML = innerHTML;
}

function handleWsMessage(data) {
  if (data.type === 'create_request_result') {
    if (data.success) {
      step1.classList.add('d-none');
      step2.classList.remove('d-none');
      statusElement.textContent = 'Waiting for your verification...';

      requestId = data.request_id;
      referenceId = data.reference_id;
      requestIdElement.textContent = 'Request ID: ' + requestId;
      referenceIdElement.textContent = 'Ref: ' + referenceId;
    }
    verifyButton.textContent = 'Request Identity Verification';
    verifyWithMockDataButton.textContent =
      'Request Identity Verification with Data request';
    verifyButton.disabled = false;
    verifyWithMockDataButton.disabled = false;
  } else if (data.type === 'request_status') {
    if (data.request_id == requestId) {
      if (data.closed) {
        requestClosed(false);
      }
      if (data.timed_out) {
        requestClosed(true);
      }

      if (
        (data.mode === 2 || data.mode === 3) &&
        data.response_list.find(
          (response) => !response.valid_signature || !response.valid_signature
        ) != null
      ) {
        statusElement.textContent = 'Verification Failed!';
        circleLoader.classList.add('load-error');
        loaderCheckmark.classList.add('error');
        loaderCheckmark.style = 'display:block;';
        return;
      }

      if (
        data.status === 'completed' ||
        data.status === 'rejected' ||
        data.status === 'errored'
      ) {
        flowFinished = true;
      }

      idpResponseCount.textContent = `${data.response_list.length}/${data.min_idp}`;
      idpResponses.textContent = data.response_list
        .map((response) => {
          if (response.error_code != null) {
            return `${response.idp_id}: ERROR (code: ${response.error_code})`;
          }
          return `${response.idp_id}: ${response.status.toUpperCase()}`;
        })
        .join('\n');
      asResponse.innerHTML = data.data_request_list
        .map((service) => {
          const responses = service.response_list
            .map((response) => {
              if (response.error_code != null) {
                return `${response.as_id}: ERROR (code: ${response.error_code})`;
              }
              return `${response.as_id}: signed: ${response.signed}, RP received: ${response.received_data}`;
            })
            .join('\n');
          const responseCount = `${service.response_list.length}/${service.min_as}`;
          return `<p><b>Service ID: ${service.service_id}</b><br />${responseCount}<br />${responses}</p>`;
        })
        .join('');
      if (data.status === 'completed' && data.data_request_list.length > 0) {
        allDataSigned = true;

        if (gotData) {
          dataStatusElement.textContent = 'Data Received and Signed by AS!';
          dataCircleLoader.classList.add('load-complete');
          dataLoaderCheckmark.classList.add('draw');
          dataLoaderCheckmark.style = 'display:block;';
        }
      }
      if (
        data.status === 'completed' ||
        (data.status === 'confirmed' &&
          data.min_idp ===
            data.response_list.filter((response) => response.error_code == null)
              .length)
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
      } else if (data.status === 'rejected') {
        statusElement.textContent = 'Verification Rejected!';
        circleLoader.classList.add('load-error');
        loaderCheckmark.classList.add('error');
        loaderCheckmark.style = 'display:block;';
      } else if (data.status === 'errored') {
        statusElement.textContent = 'Verification Errored!';
        circleLoader.classList.add('load-error');
        loaderCheckmark.classList.add('error');
        loaderCheckmark.style = 'display:block;';
      }
    }
  } else {
    console.error('Unknown data type', data);
  }
}

socket.on('message', handleWsMessage);

function sendVerifyRequest(withMockData = false, hideSourceRp = false) {
  flowFinished = false;

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
  if (withMockData) verifyWithMockDataButton.textContent = 'Requesting...';
  else verifyButton.textContent = 'Requesting...';
  verifyButton.disabled = true;
  verifyWithMockDataButton.disabled = true;

  const data_req_list = [];
  const dataReqListCount = parseInt(dataReqListCountInput.value);
  for (let i = 0; i < dataReqListCount; i++) {
    const service_id = document.getElementById('service_id_' + i).value;
    const as_id_list = document
      .getElementById('as_id_list_' + i)
      .value.split(',')
      .map((str) => str.trim())
      .filter((str) => str);
    const min_as = parseInt(document.getElementById('min_as_' + i).value);
    const request_params = document.getElementById('request_params_' + i).value;

    data_req_list.push({
      service_id,
      as_id_list,
      min_as,
      request_params,
    });
  }

  fetch('/createRequest', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      namespace: document.getElementById('namespace').value,
      identifier: document.getElementById('identifier').value,
      min_idp: document.getElementById('min_idp').value,
      withMockData,
      request_timeout: document.getElementById('timeout').value,
      idp_id_list: document
        .getElementById('idp_id_list')
        .value.split(',')
        .map((str) => str.trim())
        .filter((str) => str),
      data_request_list: data_req_list,
      mode: parseInt(
        document.querySelector('input[name="mode"]:checked').value
      ),
    }),
  })
    .then((response) => {
      if (response.status !== 200) {
        throw response;
      }
      return response.json();
    })
    .then((json) => console.log('create request', json))
    .catch((error) => {
      error.json().then((errorMessage) => window.alert(errorMessage));
      verifyButton.textContent = 'Request Identity Verification';
      verifyWithMockDataButton.textContent =
        'Request Identity Verification with Data request';
      verifyButton.disabled = false;
      verifyWithMockDataButton.disabled = false;
    });
  /*} else {
    noSelectedIdpAlert.classList.remove('d-none');
  }*/
}

function requestClosed(timeout) {
  if (flowFinished) return;
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

socket.on('dataFromAS', (data) => {
  if (data.requestId == requestId) {
    gotData = true;
    needData = false;

    if (allDataSigned) {
      dataStatusElement.textContent = 'Data Received and Signed by AS!';
      dataCircleLoader.classList.add('load-complete');
      dataLoaderCheckmark.classList.add('draw');
      dataLoaderCheckmark.style = 'display:block;';
    }
    console.log(data.dataFromAS);
    for (let i = 0; i < data.dataFromAS.length; i++) {
      //too long to display
      delete data.dataFromAS[i].source_signature;
    }
    dataDisplay.textContent = JSON.stringify(data.dataFromAS, null, 4);
  }
});
