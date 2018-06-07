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
      await API.setCallbackUrl({ url: `http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/idp/request` });
      await API.registerAccessorCallback(`http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/idp/accessor`);
      break;
    } catch (error) {
      console.error('Error setting callback URL at NDID API');
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
  const { request } = req.body;

  //console.log(request);
  eventEmitter.emit('callback', request);

  res.status(200).end();
});

app.post('/idp/accessor/:accessor_id', async (req, res) => {
  let { accessor_id } = req.params;
  let { hash_of_sid } = req.body;
  let sid = accessorSign[accessor_id];
  //console.log(sid,hash_of_sid);
  res.status(200).send(zkProof.accessorSign(sid, hash_of_sid));
});

app.listen(NDID_API_CALLBACK_PORT, () =>
  console.log(
    `Listening to NDID API callbacks on port ${NDID_API_CALLBACK_PORT}`
  )
);