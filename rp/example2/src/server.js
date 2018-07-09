import 'source-map-support/register';

import path from 'path';
import http from 'http';

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import io from 'socket.io';

import * as API from './api';
import { eventEmitter as ndidCallbackEvent } from './callbackHandler';

import './externalCryptoCallback';

import * as config from './config';

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

const WEB_SERVER_PORT = process.env.SERVER_PORT || 8080;

const app = express();

app.use('/', express.static(path.join(__dirname, '../web_files')));

app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(bodyParser.json({ limit: '2mb' }));

app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web_files/index.html'));
});

app.post('/createRequest', async (req, res) => {
  const {
    mode,
    namespace,
    identifier,
    withMockData,
    request_timeout,
    min_idp,
    idp_id_list,
  } = req.body;

  const referenceId = Math.floor(Math.random() * 100000 + 1).toString();

  try {
    const request = await API.createRequest({
      mode: mode || 3,
      namespace,
      identifier,
      reference_id: referenceId,
      idp_id_list: idp_id_list || [],
      callback_url: `http://${config.ndidApiCallbackIp}:${
        config.ndidApiCallbackPort
      }/rp/request/${referenceId}`,
      data_request_list: withMockData
        ? [
            {
              service_id: 'bank_statement',
              as_id_list: ['as1', 'as2', 'as3', 'mock_as_1'],
              min_as: 1,
              request_params: JSON.stringify({
                format: 'pdf',
              }),
            },
          ]
        : [],
      request_message: 'dummy Request Message',
      min_ial: 1.1,
      min_aal: 1,
      min_idp: min_idp ? parseInt(min_idp) : 1,
      request_timeout: request_timeout ? parseInt(request_timeout) : 86400,
    });
    res.status(200).json({ requestId: request.request_id, referenceId });
  } catch (error) {
    res.status(500).json(error.error ? error.error.message : error);
  }
});

app.get('/idps', (req, res) => {
  // res.status(200).send({
  //   idps: [
  //     {
  //       id: 1,
  //       name: 'IDP-1',
  //     },
  //     {
  //       id: 2,
  //       name: 'IDP-2',
  //     },
  //     {
  //       id: 3,
  //       name: 'IDP-3',
  //     },
  //   ],
  // });
  // TODO
});

const server = http.createServer(app);

/**
 * WebSocket
 */
const ws = io(server);
let socket;

ws.on('connection', function(_socket) {
  socket = _socket;
});

ndidCallbackEvent.on('callback', function(data) {
  if (data.type === 'create_request_result') {
    console.log('Create request result', data);
  } else if (data.type === 'request_status') {
    if (
      data.mode === 1 ||
      (data.mode === 3 &&
        data.response_valid_list.find(
          (responseValid) =>
            !responseValid.valid_proof || !responseValid.valid_ial
        ) == null)
    ) {
      if (data.status === 'completed') {
        if (data.service_list && data.service_list.length > 0) {
          getCallbackDataFromAS({
            referenceId: data.reference_id,
            requestId: data.request_id,
          });
        }
      } else if (
        data.status === 'rejected' &&
        data.answered_idp_count === data.min_idp
      ) {
        closeRequest(data.request_id);
      }
    }
  } else if (data.type === 'close_request_result') {
    if (data.success) {
      console.log('Successfully close request ID:', data.request_id);
    } else {
      console.error('Error closeing request ID:', data.request_id);
    }
  } else if (data.type === 'error') {
    // TODO: callback when using async createRequest and got error
  } else {
    console.error('Unknown callback type', data);
    return;
  }
  if (socket) {
    socket.emit('message', data);
  }
});

async function getCallbackDataFromAS({ referenceId, requestId }) {
  const dataFromAS = await API.getDataFromAS({ requestId });
  if (socket) {
    socket.emit('dataFromAS', {
      referenceId,
      requestId,
      dataFromAS,
    });
  }
}

function closeRequest(requestId) {
  const reference_id = (Date.now() % 100000).toString();

  return API.closeRequest({
    reference_id,
    callback_url: `http://${config.ndidApiCallbackIp}:${
      config.ndidApiCallbackPort
    }/rp/request/close`,
    request_id: requestId,
  });
}

server.listen(WEB_SERVER_PORT);

console.log(`RP Web Server is running. Listening to port ${WEB_SERVER_PORT}`);

// console.log(`RP ID: ${process.env.RP_ID || 1}`);
