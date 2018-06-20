import 'source-map-support/register';

import express from 'express';
import bodyParser from 'body-parser';

import * as API from './api';

import './externalCryptoCallback';

const NDID_API_CALLBACK_IP = process.env.NDID_API_CALLBACK_IP || 'localhost';
const NDID_API_CALLBACK_PORT = process.env.NDID_API_CALLBACK_PORT || 5003;

(async () => {
  for (;;) {
    try {
      await API.registerAsService({
        url: `http://${NDID_API_CALLBACK_IP}:${NDID_API_CALLBACK_PORT}/as/service/bank_statement`,
        service_id: 'bank_statement',
        service_name: 'Bank statement description',
        min_ial: 1.1,
        min_aal: 1,
      });
      break;
    } catch (error) {
      if (error.error && error.error.code === 25005) break;
      console.error('Error setting callback URL at NDID API', error);
    }
    // simple wait
    await new Promise((resolve, reject) => setTimeout(resolve, 5000)); // wait for 5 seconds
  }
})();

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/as/service/bank_statement', async (req, res) => {
  //=================== Real business logic here ========================
  const data = req.body;

  console.log('Callback from NDID API >', data);

  //set timeout to simulate request processing
  setTimeout(() => {
    res.status(200).json({
      data: 'mock data',
    });
  }, 2000);
});

app.listen(NDID_API_CALLBACK_PORT, () => {
  console.log(
    `Listening to NDID API callbacks on port ${NDID_API_CALLBACK_PORT}`
  );
});
