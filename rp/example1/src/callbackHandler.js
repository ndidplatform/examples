import EventEmitter from 'events';

import express from 'express';
import bodyParser from 'body-parser';

import * as config from './config';

export const eventEmitter = new EventEmitter();

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/rp/request/:referenceId', async (req, res) => {
  const callbackData = req.body;
  const { referenceId } = req.params;

  console.log('Received callback from NDID API:', callbackData);

  eventEmitter.emit('callback', referenceId, callbackData);

  res.status(200).end();
});

app.listen(config.ndidApiCallbackPort, () =>
  console.log(
    `Listening to NDID API callbacks on port ${config.ndidApiCallbackPort}`
  )
);
