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
    namespace,
    identifier,
    withMockData,
    request_timeout,
    min_idp,
  } = req.body;

  const referenceId = Math.floor(Math.random() * 100000 + 1).toString();

  try {
    const request = await API.createRequest({
      mode: 3,
      namespace,
      identifier,
      reference_id: referenceId,
      idp_id_list: [],
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

ndidCallbackEvent.on('callback', function(referenceId, callbackData) {
  const { type, ...other } = callbackData;

  if (type === 'request_status') {
    const request = other;

    if (request.latest_idp_response_valid === false) {
      socket && socket.emit('invalid', { referenceId });
      return;
    } else {
      socket &&
        socket.emit('request_status', {
          referenceId,
          ...request,
        });

      if (request.status === 'completed') {
        if (request.service_list && request.service_list.length > 0) {
          getCallbackDataFromAS({
            referenceId,
            requestId: request.request_id,
          });
        }
      } else if (
        request.status === 'rejected' &&
        request.answered_idp_count === request.min_idp
      ) {
        closeRequest(request.request_id);
      } else if (request.closed) {
        socket && socket.emit('closed', { referenceId });
        return;
      } else if (request.timed_out) {
        socket && socket.emit('timeout', { referenceId });
        return;
      }
    }
  } else if (type === 'error') {
    // TODO: callback when using async createRequest and got error
  }
});

async function getCallbackDataFromAS({ referenceId, requestId }) {
  const dataFromAS = await API.getDataFromAS({ requestId });
  if (socket) {
    socket.emit('dataFromAS', {
      referenceId,
      dataFromAS,
    });
  }
}

function closeRequest(requestId) {
  return API.closeRequest({ requestId });
}

server.listen(WEB_SERVER_PORT);

console.log(`RP Web Server is running. Listening to port ${WEB_SERVER_PORT}`);

// console.log(`RP ID: ${process.env.RP_ID || 1}`);
