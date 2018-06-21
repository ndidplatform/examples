/*
Copyright (c) 2018, 2019 National Digital ID COMPANY LIMITED 

This file is part of NDID software.

NDID is the free software: you can redistribute it and/or modify  it under the terms of the Affero GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

NDID is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public License for more details.

You should have received a copy of the Affero GNU General Public License along with the NDID source code.  If not, see https://www.gnu.org/licenses/agpl.txt.

please contact info@ndid.co.th for any further questions
*/

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

  console.log('Received callback from NDID API:', callbackData);
  
  eventEmitter.emit('callback', referenceId, callbackData);

  res.status(200).end();
});

app.listen(NDID_API_CALLBACK_PORT, () =>
  console.log(
    `Listening to NDID API callbacks on port ${NDID_API_CALLBACK_PORT}`
  )
);
