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
import fs from 'fs';
import * as zkProof from './zkProof';
import { spawnSync } from 'child_process';

import './externalCryptoCallback';

import * as config from './config';

//===== INIT ========
spawnSync('mkdir', ['-p', config.keyPath]);
//prevent duplicate accessor_id
const nonce = Date.now() % 1000;
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

let secretFilenameMapping = {};

app.post('/identity', async (req, res) => {
  const { namespace, identifier } = req.body;
  try {
    let sid = namespace + ':' + identifier;
    //gen new key pair
    zkProof.genNewKeyPair(sid);

    let accessor_public_key = fs.readFileSync(
      config.keyPath + sid + '.pub',
      'utf8'
    );
    //let secret =  zkProof.calculateSecret(namespace,identifier, fs.readFileSync(config.keyPath + sid,'utf8'));
    let reference_id = (Date.now() % 100000).toString();
    accessorSign[reference_id] = sid;

    //TODO mapping reference_id to callback accessor to sign
    //let accessor_id = 'some-awesome-accessor-for-' + sid + '-with-nonce-' + nonce;

    let {
      request_id,
      exist,
      /*secret*/ accessor_id,
    } = await API.createNewIdentity({
      namespace,
      identifier,
      reference_id,
      accessor_type: 'awesome-type',
      accessor_public_key,
      //accessor_id,
      ial: 2.3,
    });

    accessorSign[accessor_id] = sid;
    await db.setAccessorIdBySid(sid, accessor_id);

    //fs.writeFileSync(config.keyPath + 'secret_' + sid, secret, 'utf8');
    secretFilenameMapping[request_id] = sid;
    fs.writeFileSync(config.keyPath + 'nonce_' + sid, nonce, 'utf8');
    db.addUser(namespace, identifier);

    res.status(200).send({
      request_id,
      exist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error.error ? error.error.message : error);
  }
});

app.post('/accessors', async (req, res) => {
  const { namespace, identifier } = req.body;
  try {
    let sid = namespace + ':' + identifier;
    let fileName = sid + Date.now().toString();
    //gen new key pair
    zkProof.genNewKeyPair(fileName);

    let accessor_public_key = fs.readFileSync(
      config.keyPath + fileName + '.pub',
      'utf8'
    );
    //let secret =  zkProof.calculateSecret(namespace,identifier, fs.readFileSync(config.keyPath + sid,'utf8'));
    let reference_id = (Date.now() % 100000).toString();
    accessorSign[reference_id] = fileName;

    //TODO mapping reference_id to callback accessor to sign
    //let accessor_id = 'some-awesome-accessor-for-' + sid + '-with-nonce-' + nonce;

    let { request_id, /*secret*/ accessor_id } = await API.addAccessor({
      namespace,
      identifier,
      reference_id,
      accessor_type: 'awesome-type',
      accessor_public_key,
      //accessor_id,
    });

    accessorSign[accessor_id] = fileName;
    secretFilenameMapping[request_id] = fileName;
    fs.writeFileSync(config.keyPath + 'nonce_' + fileName, nonce, 'utf8');

    res.status(200).send({
      request_id,
      accessor_id,
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
  if (!user) {
    res.status(500).end();
    return;
  }
  const userId = user.id;
  const requests = db.getRequests(userId);

  res.status(200).send(requests);
});

async function createResponse(userId, requestId, status) {
  const user = db.getUser(userId);
  const savedRequest = db.getRequest(userId, requestId);
  const sid = user.namespace + ':' + user.identifier;
  let nonce = fs.readFileSync(config.keyPath + 'nonce_' + sid, 'utf8');
  if (!savedRequest) {
    throw 'Unknown request ID';
  }

  try {
    await API.createIdpResponse({
      request_id: requestId,
      namespace: user.namespace,
      identifier: user.identifier,
      ial: 2.3,
      aal: 3,
      secret: fs.readFileSync(config.keyPath + 'secret_' + sid, 'utf8'),
      status,
      signature: zkProof.signMessage(
        savedRequest.request_message,
        config.keyPath + sid
      ),
      accessor_id: (await db.getAccessorIdBySid(sid)).accessor_id,
      callback_url: `http://${config.ndidApiCallbackIp}:${
        config.ndidApiCallbackPort
      }/idp/response`,
    });
  } catch (error) {
    throw error;
  }
}

app.post('/accept', async (req, res) => {
  const { userId, requestId } = req.body;
  try {
    await createResponse(userId, requestId, 'accept');
    res.status(200).end();
  } catch (error) {
    if (
      error.error &&
      (error.error.code === 20025 || error.error.code === 20026)
    ) {
      db.removeRequest(requestId);
    }
    res.status(500).json(error.error ? error.error.message : error);
  }
});

app.post('/reject', async (req, res) => {
  const { userId, requestId } = req.body;
  try {
    await createResponse(userId, requestId, 'reject');
    res.status(200).end();
  } catch (error) {
    if (
      error.error &&
      (error.error.code === 20025 || error.error.code === 20026)
    ) {
      db.removeRequest(requestId);
    }
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
/*let socket;

ws.on('connection', function(_socket) {
  socket = _socket;
});*/

ndidCallbackEvent.on('callback', (request) => {
  // Save request to local DB
  //db.saveRequest(db.getUserByCid(request.identifier).id, request);
  if (request.type === 'create_identity_result') {
    ws.emit('onboardResponse', request);
    if (request.secret) {
      fs.writeFileSync(
        config.keyPath + 'secret_' + secretFilenameMapping[request.request_id],
        request.secret,
        'utf8'
      );
    }
    return;
  }
  if (request.type === 'add_accessor_result') {
    ws.emit('accessorResponse', request);
    console.log('EMITTED', request);
    if (request.secret) {
      fs.writeFileSync(
        config.keyPath + 'secret_' + secretFilenameMapping[request.request_id],
        request.secret,
        'utf8'
      );
    }
    return;
  }
  if (request.type === 'response_result') {
    if (request.success) {
      db.removeRequest(request.request_id);
    } else {
      if (
        request.error &&
        (request.error.code === 25003 || request.error.code === 25004)
      ) {
        db.removeRequest(request.request_id);
      }
    }
    ws.emit('responseResult', request);
    return;
  }
  let user = db.getUserByIdentifier(request.namespace, request.identifier);
  if (!user) return;
  db.saveRequest(user.id, request);
  ws.emit('newRequest', request);
});

server.listen(WEB_SERVER_PORT);

console.log(`IDP Web Server is running. Listening to port ${WEB_SERVER_PORT}`);
