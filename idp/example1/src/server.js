import 'source-map-support/register';

import path from 'path';
import http from 'http';
import io from 'socket.io';

import bodyParser from 'body-parser';

import express from 'express';
import morgan from 'morgan';

import * as API from './api';
import { eventEmitter as ndidCallbackEvent } from './callbackHandler';
import { accessorSign } from './callbackHandler';

import * as db from './db';
import * as config from './config';
import fs from 'fs';
import * as zkProof from './zkProof';
import { spawnSync } from 'child_process';

import './externalCryptoCallback';

//===== INIT ========
spawnSync('mkdir',['-p',config.keyPath]);
//prevent duplicate accessor_id
const nonce = Date.now()%1000;
//===================

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

    let sid = namespace + ':' + identifier;
    //gen new key pair
    zkProof.genNewKeyPair(sid);

    let accessor_public_key = fs.readFileSync(config.keyPath + sid + '.pub','utf8');
    //let secret =  zkProof.calculateSecret(namespace,identifier, fs.readFileSync(config.keyPath + sid,'utf8'));
    let reference_id = (Date.now()%100000).toString();
 
    //TODO mapping reference_id to callback accessor to sign
    let accessor_id = 'some-awesome-accessor-for-' + sid + '-with-nonce-' + nonce;
    accessorSign[accessor_id] = sid;

    let { request_id, exist, secret } = await API.createNewIdentity({
      namespace,
      identifier,
      reference_id,
      accessor_type: 'awesome-type',
      accessor_public_key,
      accessor_id,
      ial: 2.3
    });
  
    fs.writeFileSync(config.keyPath + 'secret_' + sid, secret, 'utf8');
    fs.writeFileSync(config.keyPath + 'nonce_' + sid, nonce, 'utf8');
    db.addUser(namespace, identifier);
  
    res.status(200).send({
      request_id,
      exist
    });
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
  const user = db.getUserByIdentifier(namespace, identifier);
  if(!user) {
    res.status(500).end();
    return;
  }
  const userId = user.id;
  const requests = db.getRequests(userId);

  res.status(200).send(requests);
});

async function createResponse(req, res, status) {
  const { userId, requestId } = req.body;

  const user = db.getUser(userId);
  const savedRequest = db.getRequest(userId, requestId);
  const sid = user.namespace + ':' + user.identifier;
  let nonce = fs.readFileSync(config.keyPath + 'nonce_' + sid, 'utf8');
  if (!savedRequest) {
    res.status(500).json('Unknown request ID');
    return;
  }

  try {
    await API.createIdpResponse({
      request_id: requestId,
      namespace: user.namespace,
      identifier: user.identifier,
      ial: 3,
      aal: 3,
      secret: fs.readFileSync(config.keyPath + 'secret_' + sid, 'utf8'),
      status,
      signature: zkProof.signMessage(savedRequest.request_message, config.keyPath + sid),
      accessor_id: 'some-awesome-accessor-for-' + sid + '-with-nonce-' + nonce,
    });

    db.removeRequest(requestId);

    res.status(200).end();
  } catch (error) {
    //TODO handle when error with other reason than closed or timed out
    db.removeRequest(requestId);
    res.status(500).json(error.error ? error.error.message : error);
  }
}

app.post('/accept', async (req, res) => {
  createResponse(req, res, 'accept');
});

app.post('/reject', async (req, res) => {
  createResponse(req, res, 'reject');
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
  if(request.type === 'onboard_request') {
    socket.emit('onboardResponse', request);
    return;
  }
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
