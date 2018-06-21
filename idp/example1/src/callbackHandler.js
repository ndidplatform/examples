import EventEmitter from 'events';

import express from 'express';
import bodyParser from 'body-parser';

import * as API from './api';
import * as zkProof from './zkProof';

const NDID_API_CALLBACK_IP = process.env.NDID_API_CALLBACK_IP || 'localhost';
const NDID_API_CALLBACK_PORT = process.env.NDID_API_CALLBACK_PORT || 5002;

(async () => {
  for (;;) {
    try {
      await API.setCallbackUrls({
        incoming_request_url: `http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/idp/request`,
        identity_result_url: `http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/idp/identity`,
        accessor_sign_url: `http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/idp/accessor`,
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
export let accessorSign = {};

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/idp/request', async (req, res) => {
  const callbackData = req.body;

  console.log('Received incoming request callback from NDID API:', callbackData);

  eventEmitter.emit('callback', callbackData);

  res.status(200).end();
});

app.post('/idp/identity', async (req, res) => {
  const callbackData = req.body;

  console.log('Received identity result callback from NDID API:', callbackData);

  eventEmitter.emit('callback', callbackData);

  res.status(200).end();
});

app.post('/idp/accessor', async (req, res) => {
  let { sid_hash, accessor_id, reference_id } = req.body;
  let fileName = accessorSign[accessor_id] 
  ? accessorSign[accessor_id] : accessorSign[reference_id];
  //console.log(sid,hash_of_sid);
  res.status(200).send({
    signature: zkProof.accessorSign(fileName, sid_hash),
  });
  //test accessor/sign failed
  //res.status(500).end();
});

app.listen(NDID_API_CALLBACK_PORT, () =>
  console.log(
    `Listening to NDID API callbacks on port ${NDID_API_CALLBACK_PORT}`
  )
);
