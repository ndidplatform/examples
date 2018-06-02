import EventEmitter from 'events';

import express from 'express';
import bodyParser from 'body-parser';

const NDID_API_CALLBACK_PORT = process.env.NDID_API_CALLBACK_PORT || 5001;

export const eventEmitter = new EventEmitter();

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/rp/request/:referenceId', async (req, res) => {
  const callbackData = req.body;
  const { referenceId } = req.params; 

  //console.log(request);
  eventEmitter.emit('callback', referenceId, callbackData);

  res.status(200).end();
});

app.listen(NDID_API_CALLBACK_PORT, () =>
  console.log(
    `Listening to NDID API callbacks on port ${NDID_API_CALLBACK_PORT}`
  )
);
