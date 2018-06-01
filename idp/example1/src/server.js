import path from 'path';
import http from 'http';
import io from 'socket.io';

import bodyParser from 'body-parser';

import express from 'express';
import morgan from 'morgan';

import * as API from './api';
import { eventEmitter as ndidCallbackEvent } from './callbackHandler';

import * as db from './db';
import fs from 'fs';
import * as zkProof from './zkProof';

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

const WEB_SERVER_PORT = process.env.SERVER_PORT || 8181;

const app = express();

app.use('/', express.static(path.join(__dirname, '../web_files')));

app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(bodyParser.json({ limit: '2mb' }));

app.use(morgan('combined'));

// FOR DEBUG
if (
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === undefined
) {
  app.use((req, res, next) => {
    if (req.method === 'POST') {
      console.log(req.method, req.originalUrl, req.params, req.body);
    }
    if (req.method === 'GET') {
      console.log(req.method, req.originalUrl, req.params, req.query);
    }
    next();
  });
}

app.get('/identity', (req, res) => {
  res.sendFile(path.join(__dirname, '../web_files/identity.html'));
});

app.post('/identity', async (req, res) => {
  const { namespace, identifier } = req.body;
  try {

    let accessor_public_key = fs.readFileSync('./dev_user_key/user.pub','utf8');
    let secret =  zkProof.calculateSecret(namespace,identifier, fs.readFileSync('./dev_user_key/user','utf8'));
    fs.writeFileSync('./dev_user_key/secret', secret, 'utf8');

    await API.createNewIdentity({
      namespace,
      identifier,
      //secret: 'MAGIC',
      accessor_type: 'awesome-type',
      accessor_public_key,
      accessor_id: 'some-awesome-accessor',
      accessor_group_id: 'not-so-awesome-group-id',
    });
  
    db.addUser(namespace, identifier);
  
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).json(error.error ? error.error.message : error);
  }
});

app.get('/home/:namespace/:identifier', (req, res) => {
  res.sendFile(path.join(__dirname, '../web_files/index.html'));
});

app.get('/requests/:namespace/:identifier', async function(req, res) {
  const { namespace, identifier } = req.params;
  const userId = db.getUserByIdentifier(namespace, identifier).id;
  const requests = db.getRequests(userId);

  res.status(200).send(requests);
});

//=============================================================================
//TODO query secret, accessor details and use to response accept/reject
//=============================================================================

app.post('/accept', async (req, res) => {
  const { userId, requestId } = req.body;

  const user = db.getUser(userId);
  const savedRequest = db.getRequest(userId, requestId);
  if (!savedRequest) {
    res.status(500).json('Unknown request ID');
    return;
  }

  try {
    await API.createIdpResponse({
      request_id: requestId,
      namespace: 'cid',
      identifier: user.identifier,
      ial: 3,
      aal: 3,
      secret: fs.readFileSync('./dev_user_key/secret','utf8'),
      status: 'accept',
      signature: '<signature>',
      accessor_id: 'some-awesome-accessor',
    });

    db.removeRequest(requestId);

    res.status(200).end();
  } catch (error) {
    //TODO handle when error with other reason than closed or timed out
    db.removeRequest(requestId);
    res.status(500).json(error.error ? error.error.message : error);
  }
});

app.post('/reject', async (req, res) => {
  const { userId, requestId } = req.body;

  const user = db.getUser(userId);
  const savedRequest = db.getRequest(userId, requestId);
  if (!savedRequest) {
    res.status(500).json('Unknown request ID');
    return;
  }

  try {
    await API.createIdpResponse({
      request_id: requestId,
      namespace: 'cid',
      identifier: user.identifier,
      ial: 1.2,
      aal: 2.1,
      secret: '<secret>',
      status: 'reject',
      signature: '<signature>',
      accessor_id: '<accessor_id>',
    });

    db.removeRequest(requestId);

    res.status(200).end();
  } catch (error) {
    //TODO handle when error with other reason than closed or timed out
    db.removeRequest(requestId);
    res.status(500).json(error.error ? error.error.message : error);
  }
});

app.get('/getUserId/:namespace/:identifier', (req, res) => {
  const { namespace, identifier } = req.params;
  let user = db.getUserByIdentifier(namespace, identifier);
  return res.status(200).send(user ? user.id.toString() : '0');
});

const server = http.createServer(app);

const ws = io(server);
let socket;

ws.on('connection', function(_socket) {
  socket = _socket;
});

ndidCallbackEvent.on('callback', (request) => {
  // Save request to local DB
  //db.saveRequest(db.getUserByCid(request.identifier).id, request);
  let user = db.getUserByIdentifier(request.namespace, request.identifier);
  if(!user) return;
  db.saveRequest(
    user.id,
    request
  );
  socket.emit('newRequest', request);
});

server.listen(WEB_SERVER_PORT);

console.log(`IDP Web Server is running. Listening to port ${WEB_SERVER_PORT}`);
