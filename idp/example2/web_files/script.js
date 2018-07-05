const pendingList = document.getElementById('pendingList');
// const approvedList = document.getElementById('approved');
// const deniedList = document.getElementById('denied');
const loadingIndicators = document.getElementsByClassName('loading-indicator');
const socket = io('/');

function handleWsMessage(data) {
  if (data.type === 'incoming_request') {
    fetchAndUpdateRequestList();
  } else if (data.type === 'response_result') {
    const { request_id, success, error } = data;
    if (success === false) {
      window.alert(
        `Response to request ID: ${request_id} has failed with error: ${
          error.message
        } (${error.code})`
      );
    }
    fetchAndUpdateRequestList();
  } else {
    console.error('Unknown data type', data);
  }
}

socket.on('message', handleWsMessage);

window.addEventListener('load', fetchAndUpdateRequestList);

let namespace, identifier, userId;

function fetchAndUpdateRequestList() {
  let args = window.location.href.split('/');
  namespace = args[args.length - 2];
  identifier = args[args.length - 1];
  if (!namespace || !identifier) window.location = '/identity';
  fetch('/getUserId/' + namespace + '/' + identifier)
    .then((response) => {
      if (response.status === 404) {
        alert('User not found');
        window.location = '/identity';
        return;
      }
      return response.json();
    })
    .then((_userId) => {
      userId = _userId.id;
    });
  fetch('/requests/' + namespace + '/' + identifier)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      hideLoadingIndicators();
      updateRequestList(json);
    })
    .catch(function(error) {
      console.error(error);
    });
}

function hideLoadingIndicators() {
  Array.prototype.forEach.call(loadingIndicators, (ele) => {
    ele.style = 'display:none;';
  });
}

function clearRequestList() {
  while (pendingList.firstChild)
    pendingList.removeChild(pendingList.firstChild);
  // while (approvedList.firstChild)
  //   approvedList.removeChild(approvedList.firstChild);
  // while (deniedList.firstChild) deniedList.removeChild(deniedList.firstChild);
}

function updateRequestList(requests) {
  clearRequestList();
  requests.forEach((request) => {
    const listItem = createListItem(request);
    pendingList.appendChild(listItem);
  });

  if (pendingList.children.length === 0) {
    pendingList.appendChild(createEmptyTextListItem());
  }
  // if (approvedList.children.length === 0) {
  //   approvedList.appendChild(createEmptyTextListItem());
  // }
  // if (deniedList.children.length === 0) {
  //   deniedList.appendChild(createEmptyTextListItem());
  // }
}

function createListItem(requestObject) {
  let li = document.createElement('li');
  li.classList.add('list-group-item');
  li.classList.add('request-list-item');
  // let displayData = Object.assign({}, requestObject);
  // delete displayData.userId;

  let infoDiv = document.createElement('div');
  infoDiv.classList.add('request-info');
  infoDiv.innerHTML = `<div style="word-break: break-all;"><b>Request ID</b>: ${
    requestObject.request_id
  }</div>
    <div><b>Message</b>: ${requestObject.request_message}</div>`;

  if (requestObject.data_request_list.length !== 0) {
    let dataDiv = document.createElement('div');
    dataDiv.innerHTML = `<b>Request data</b>:<br/>`;

    for (let i in requestObject.data_request_list) {
      let dataObject = requestObject.data_request_list[i];
      let dataLi = document.createElement('li');
      dataLi.classList.add('data-list-item');
      if (dataObject.as_id_list) {
        let asList = dataObject.as_id_list.join(', ');
        dataLi.innerHTML = `${dataObject.service_id} from ${
          dataObject.min_as
        } of ${asList}`;
      } else {
        dataLi.innerHTML = `${dataObject.service_id} from ${
          dataObject.min_as
        } AS`;
      }
      dataDiv.appendChild(dataLi);
    }
    infoDiv.appendChild(dataDiv);
  }

  li.appendChild(infoDiv);

  let buttonsDiv = document.createElement('div');
  buttonsDiv.classList.add('request-buttons');
  li.appendChild(buttonsDiv);

  if (!requestObject.processed) {
    buttonsDiv.appendChild(
      createRequestButton(userId, requestObject.request_id, 'accept')
    );
    buttonsDiv.appendChild(
      createRequestButton(userId, requestObject.request_id, 'reject')
    );
  }
  return li;
}

function createEmptyTextListItem() {
  let li = document.createElement('li');
  li.classList.add('list-group-item');

  li.textContent = 'No items';

  return li;
}

function createRequestButton(userId, requestId, action) {
  var buttonElement = document.createElement('button');
  buttonElement.type = 'button';
  buttonElement.classList.add('btn');
  buttonElement.classList.add('btn-block');
  buttonElement.dataset.requestId = requestId;
  let apiUrlPath;
  if (action === 'accept') {
    buttonElement.classList.add('btn-success');
    buttonElement.textContent = 'Accept';
    apiUrlPath = '/accept';
  } else if (action === 'reject') {
    buttonElement.classList.add('btn-danger');
    buttonElement.textContent = 'Reject';
    apiUrlPath = '/reject';
  }
  buttonElement.addEventListener('click', (event) => {
    const buttons = document.querySelectorAll(
      `button[data-request-id="${requestId}"]`
    );
    buttons.forEach((button) => {
      button.disabled = true;
    });
    fetch(apiUrlPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId,
        userId,
      }),
    })
      .then((response) => {
        if (response.status !== 200) {
          throw response;
        }
        return response.json();
      })
      // .then((json) => {
      //   //console.log(json);
      // })
      .catch((error) => {
        error.json().then((errorMessage) => window.alert(errorMessage));
        fetchAndUpdateRequestList();
        buttons.forEach((button) => {
          button.disabled = false;
        });
      });
  });
  return buttonElement;
}
