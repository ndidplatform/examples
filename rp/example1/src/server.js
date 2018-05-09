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
  const { namespace, identifier, withMockData } = req.body;

  const referenceId = (Math.floor(Math.random() * 100000 + 1)).toString();

  try {
    const request = await API.createRequest({
      namespace,
      identifier,
      reference_id: referenceId,
      idp_list: [],
      callback_url: `http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/rp/request/${referenceId}`,
      data_request_list: withMockData ? [{ 
        service_id: 'bank_statement', 
        as_id_list: ['AS1', 'AS2', 'AS3'],
        count: 2,
        request_params: { 
          format: 'pdf' } 
      }] : [],
      request_message: 'dummy Request Message',
      min_ial: 1.1,
      min_aal: 1,
      min_idp: 1,
      request_timeout: 259200,
    });
    res.status(200).send({ requestId: request.requestId, referenceId });
  } catch (error) {
    res.status(500).end();
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

ndidCallbackEvent.on('callback', function(referenceId, request, dataFromAS) {
  if(request) {
    if (request.status === 'completed') {
      if (socket) {
        socket.emit('success', { referenceId });
      }
    } else if (request.status === 'rejected') {
      if (socket) {
        socket.emit('deny', { referenceId });
      }
    }
  }
  else if(dataFromAS) {
    if(socket) {
      socket.emit('dataFromAS', {
        referenceId,
        dataFromAS
      });
    }
  }
});

// ndidCallbackEvent.event.on('error', function(event) {
//   if (socket) {
//     socket.emit('fail', { requestId: event.requestId });
//   }
// });

server.listen(WEB_SERVER_PORT);

console.log(`RP Web Server is running. Listening to port ${WEB_SERVER_PORT}`);

// console.log(`RP ID: ${process.env.RP_ID || 1}`);
