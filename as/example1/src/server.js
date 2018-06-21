/*
Copyright (c) 2018, 2019 National Digital ID COMPANY LIMITED 

This file is part of NDID software.

NDID is the free software: you can redistribute it and/or modify  it under the terms of the Affero GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

NDID is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public License for more details.

You should have received a copy of the Affero GNU General Public License along with the NDID source code.  If not, see https://www.gnu.org/licenses/agpl.txt.

please contact info@ndid.co.th for any further questions
*/

import 'source-map-support/register';

import express from 'express';
import bodyParser from 'body-parser';

import * as API from './api';
import path from 'path';

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
  res.status(204).end();
  setTimeout(() => {
    API.sendData({
      data: 'Mock data async',
      service_id: 'bank_statement',
      request_id: data.request_id,
    });
    /*res.status(200).json({
      data: 'mock data',
    });*/
  }, 2000);
});

app.get('/license', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../LICENSE'));
});

app.get('/source', (req, res) => {
  res.status(200).send('https://github.com/ndidplatform/examples');
});

app.listen(NDID_API_CALLBACK_PORT, () => {
  console.log(
    `Listening to NDID API callbacks on port ${NDID_API_CALLBACK_PORT}`
  );
});
