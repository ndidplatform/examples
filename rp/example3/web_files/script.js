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
const asSignedResponseCount = document.getElementById(
  'as-signed-response-count'
);
const asDataResponseCount = document.getElementById('as-data-response-count');

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

const updateDataReqListCountButton = document.getElementById('update_data_req_list_count_btn');
updateDataReqListCountButton.addEventListener('click', (event) => {
    console.log('dafuq');
    updateDataReqListCount()
  });

function updateDataReqListCount() {
  const count = $('#data_req_list_count').val();

  if (!isFinite(count) || count < 0) return;

  $('#data_req_list').html('');

  for (let i = 0; i < count; i++) {
    $('#data_req_list').append(
      '<li style="list-style:none;" id="data_req_list_item_' + i + '">' +
        'Service ID: <input type="textbox" id="service_id" class="form-control" placeholder="e.g. 001.cust_info_001"></input>' +
        'AS ID List: <input type="textbox" id="as_id_list" class="form-control" placeholder="e.g. as1, as2"></input>' +
        'AS Needed: <input type="textbox" id="min_as" class="form-control"></input>' +
        'Request Params: <input type="textbox" id="request_params" class="form-control"></input>' +
        (i < count - 1 ? '<hr />' : '') +
      '</li>'
    );
  }
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
        data.response_valid_list.find(
          (responseValid) =>
            !responseValid.valid_signature || !responseValid.valid_signature
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
        (data.status === 'rejected' && data.answered_idp_count === data.min_idp)
      ) {
        flowFinished = true;
      }

      idpResponseCount.textContent = `${data.answered_idp_count}/${
        data.min_idp
      }`;
      asSignedResponseCount.innerHTML = data.service_list.reduce(
        (HtmlString, service) => {
          return (
            HtmlString +
            `<div>${service.service_id}: ${service.signed_data_count}/${
              service.min_as
            }</div>`
          );
        },
        ''
      );
      asDataResponseCount.innerHTML = data.service_list.reduce(
        (HtmlString, service) => {
          return (
            HtmlString +
            `<div>${service.service_id}: ${service.received_data_count}/${
              service.min_as
            }</div>`
          );
        },
        ''
      );
      if (data.status === 'completed' && data.service_list.length > 0) {
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
          data.min_idp === data.answered_idp_count)
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
  const dataReqListCount = parseInt(document.getElementById('data_req_list_count').value);
  for (let i = 0; i < dataReqListCount; i++) {
    const listItem = $('#data_req_list_item_' + i);
    const service_id = listItem
      .find('#service_id')
      .val();
    const as_id_list = listItem
      .find('#as_id_list')
      .val()
      .split(',')
      .map((str) => str.trim())
      .filter((str) => str);
    const min_as = parseInt(listItem.find('#min_as').val());
    const request_params = listItem.find('#request_params').val();

    data_req_list.push({
      service_id,
      as_id_list,
      min_as,
      request_params
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
