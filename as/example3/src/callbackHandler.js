import EventEmitter from 'events';

import express from 'express';
import bodyParser from 'body-parser';

import * as config from './config';

export const eventEmitter = new EventEmitter();

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/as/service/:serviceId', async (req, res) => {
  const callbackData = req.body;
  const { serviceId } = req.params;
  console.log(
    `Received data request callback for service: ${serviceId} from NDID API:`,
    JSON.stringify(callbackData, null, 2)
  );
  eventEmitter.emit('callback', callbackData);
  res.status(204).end();
});

app.post('/as/service', async (req, res) => {
  const callbackData = req.body;
  console.log(
    'Received register service callback from NDID API:',
    JSON.stringify(callbackData, null, 2)
  );
  eventEmitter.emit('callback', callbackData);
  res.status(204).end();
});

app.post('/as/data', async (req, res) => {
  const callbackData = req.body;
  console.log('Received send data callback from NDID API:', JSON.stringify(callbackData, null, 2));
  eventEmitter.emit('callback', callbackData);
  res.status(204).end();
});

app.listen(config.ndidApiCallbackPort, () =>
  console.log(
    `Listening to NDID API callbacks on port ${config.ndidApiCallbackPort}`
  )
);
