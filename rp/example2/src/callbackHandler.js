import EventEmitter from 'events';

import express from 'express';
import bodyParser from 'body-parser';

import * as config from './config';

export const eventEmitter = new EventEmitter();

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/rp/request/:referenceId', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('Received request callback from NDID API:', callbackData);
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/rp/request/close', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('Received close request callback from NDID API:', callbackData);
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
