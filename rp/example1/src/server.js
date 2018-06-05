import path from 'path';
import http from 'http';

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import io from 'socket.io';

import * as API from './api';
import { eventEmitter as ndidCallbackEvent } from './callbackHandler';

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

const WEB_SERVER_PORT = process.env.SERVER_PORT || 8080;

const NDID_API_CALLBACK_IP = process.env.NDID_API_CALLBACK_IP || 'localhost';
const NDID_API_CALLBACK_PORT = process.env.NDID_API_CALLBACK_PORT || 5001;

const app = express();

app.use('/', express.static(path.join(__dirname, '../web_files')));

app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(bodyParser.json({ limit: '2mb' }));

app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web_files/index.html'));
});

app.post('/createRequest', async (req, res) => {
  const { namespace, identifier, withMockData, request_timeout } = req.body;

  const referenceId = Math.floor(Math.random() * 100000 + 1).toString();

  try {
    const request = await API.createRequest({
      namespace,
      identifier,
      reference_id: referenceId,
      idp_list: [],
      callback_url: `http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/rp/request/${referenceId}`,
      data_request_list: withMockData
        ? [
            {
              service_id: 'bank_statement',
              as_id_list: ['as1', 'as2', 'as3'],
              count: 1,
              request_params: {
                format: 'pdf',
              },
            },
          ]
        : [],
      request_message: 'dummy Request Message',
      min_ial: 1.1,
      min_aal: 1,
      min_idp: 1,
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

  if (type === 'request_event') {
    const request = other;

    if (request.latest_response_valid === false) {
      socket && socket.emit('invalid', { referenceId });
      return;
    } else if (request.is_closed) {
      socket && socket.emit('closed', { referenceId });
      return;
    } else if (request.is_timed_out) {
      socket && socket.emit('timeout', { referenceId });
      return;
    } else {
      if (
        request.status === 'completed' &&
        request.service_list &&
        request.service_list.length > 0
      ) {
        console.log('All AS signed answered data');
      }
      socket &&
        socket.emit('request_event', {
          referenceId,
          ...request,
        });
    }
  } else if (type === 'error') {
    // TODO: callback when using async createRequest and got error
  } else if (type === 'data_received') {
    if (other.received_all === true) {
      getAndCallbackDataFromAS({
        referenceId,
        requestId: other.request_id,
      });
    }
  }
});

async function getAndCallbackDataFromAS({ referenceId, requestId }) {
  const dataFromAS = await API.getDataFromAS({ requestId });
  if (socket) {
    socket.emit('dataFromAS', {
      referenceId,
      dataFromAS,
    });
  }
}

server.listen(WEB_SERVER_PORT);

console.log(`RP Web Server is running. Listening to port ${WEB_SERVER_PORT}`);

// console.log(`RP ID: ${process.env.RP_ID || 1}`);
