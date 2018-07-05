import EventEmitter from 'events';

import express from 'express';
import bodyParser from 'body-parser';

import * as API from './api';
import * as zkProof from './zkProof';
import * as db from './db';

import * as config from './config';

(async () => {
  for (;;) {
    try {
      await API.setCallbackUrls({
        incoming_request_url: `http://${config.ndidApiCallbackIp}:${
          config.ndidApiCallbackPort
        }/idp/request`,
        accessor_sign_url: `http://${config.ndidApiCallbackIp}:${
          config.ndidApiCallbackPort
        }/idp/accessor`,
      });
      break;
    } catch (error) {
      console.error('Error setting callback URL at NDID API', error);
    }
    // simple wait
    await new Promise((resolve, reject) => setTimeout(resolve, 5000)); // wait for 5 seconds
  }
})();

export const eventEmitter = new EventEmitter();

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/idp/request', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log(
      'Received incoming request callback from NDID API:',
      callbackData
    );
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/identity', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log(
      'Received create identity callback from NDID API:',
      callbackData
    );
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/identity/accessor', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('Received add accessor callback from NDID API:', callbackData);
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/accessor', async (req, res) => {
  try {
    let { sid_hash, accessor_id, reference_id } = req.body;
    const { accessor_private_key } = db.getReference(reference_id);
    //console.log(sid,hash_of_sid);
    res.status(200).send({
      signature: zkProof.accessorSign(accessor_private_key, sid_hash),
    });
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/response', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log(
      'Received response result callback from NDID API:',
      callbackData
    );
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.listen(config.ndidApiCallbackPort, () =>
  console.log(
    `Listening to NDID API callbacks on port ${config.ndidApiCallbackPort}`
  )
);
