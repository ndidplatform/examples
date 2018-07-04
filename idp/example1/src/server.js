import 'source-map-support/register';

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
import { spawnSync } from 'child_process';

import './externalCryptoCallback';

import * as config from './config';

//===== INIT ========
spawnSync('mkdir', ['-p', config.keyPath]);
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
    const sid = namespace + ':' + identifier;
    //gen new key pair
    zkProof.genNewKeyPair(sid);

    const accessor_public_key = fs.readFileSync(
      config.keyPath + sid + '.pub',
      'utf8'
    );
    const accessor_private_key = fs.readFileSync(config.keyPath + sid, 'utf8');

    const reference_id = (Date.now() % 100000).toString();

    db.addOrUpdateReference(reference_id, {
      namespace,
      identifier,
      accessor_private_key,
      accessor_public_key,
    });

    const { request_id, exist, accessor_id } = await API.createNewIdentity({
      namespace,
      identifier,
      reference_id,
      accessor_type: 'awesome-type',
      accessor_public_key,
      //accessor_id,
      ial: 2.3,
    });

    db.addOrUpdateReference(reference_id, {
      request_id,
      exist,
      accessor_id,
    });

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
    const sid = namespace + ':' + identifier;
    const fileName = sid + Date.now().toString();
    //gen new key pair
    zkProof.genNewKeyPair(fileName);

    const accessor_public_key = fs.readFileSync(
      config.keyPath + fileName + '.pub',
      'utf8'
    );
    const accessor_private_key = fs.readFileSync(
      config.keyPath + fileName,
      'utf8'
    );

    const reference_id = (Date.now() % 100000).toString();

    db.addOrUpdateReference(reference_id, {
      namespace,
      identifier,
      accessor_private_key,
      accessor_public_key,
    });

    const { request_id, accessor_id } = await API.addAccessor({
      namespace,
      identifier,
      reference_id,
      accessor_type: 'awesome-type',
      accessor_public_key,
      //accessor_id,
    });

    db.addOrUpdateReference(reference_id, {
      request_id,
      accessor_id,
    });

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
      secret: user.accessors[0].secret,
      status,
      signature: zkProof.signMessage(
        savedRequest.request_message,
        user.accessors[0].accessor_private_key
      ),
      accessor_id: user.accessors[0].accessor_id,
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
  if (user != null) {
    res.status(200).json(user);
  } else {
    res.status(404).end();
  }
});

const server = http.createServer(app);

const ws = io(server);
/*let socket;

ws.on('connection', function(_socket) {
  socket = _socket;
});*/

ndidCallbackEvent.on('callback', (data) => {
  // Save request to local DB
  //db.saveRequest(db.getUserByCid(request.identifier).id, request);
  if (data.type === 'create_identity_result') {
    if (data.success) {
      const {
        namespace,
        identifier,
        accessor_id,
        accessor_private_key,
        accessor_public_key,
      } = db.getReference(data.reference_id);
      db.addUser(namespace, identifier, {
        accessors: [
          {
            accessor_id,
            accessor_private_key,
            accessor_public_key,
            secret: data.secret,
          },
        ],
      });
    }
    db.removeReference(data.reference_id);
    ws.emit('onboardResponse', data);
    return;
  }
  if (data.type === 'add_accessor_result') {
    if (data.success) {
      const {
        namespace,
        identifier,
        accessor_id,
        accessor_private_key,
        accessor_public_key,
      } = db.getReference(data.reference_id);
      const user = db.getUserByIdentifier(namespace, identifier);
      db.updateUser(namespace, identifier, {
        accessors: [
          ...user.accessors,
          {
            accessor_id,
            accessor_private_key,
            accessor_public_key,
            secret: data.secret,
          },
        ],
      });
    }
    db.removeReference(data.reference_id);
    ws.emit('accessorResponse', data);
    return;
  }
  if (data.type === 'response_result') {
    if (data.success) {
      db.removeRequest(data.request_id);
    } else {
      if (
        data.error &&
        (data.error.code === 25003 || data.error.code === 25004)
      ) {
        db.removeRequest(data.request_id);
      }
    }
    ws.emit('responseResult', data);
    return;
  }
  if (data.type === 'incoming_request') {
    const user = db.getUserByIdentifier(data.namespace, data.identifier);
    if (!user) return;
    db.saveRequest(user.id, data);
    ws.emit('newRequest', data);
    return;
  }
  console.error('Unknown callback type', data);
});

server.listen(WEB_SERVER_PORT);

console.log(`IDP Web Server is running. Listening to port ${WEB_SERVER_PORT}`);
