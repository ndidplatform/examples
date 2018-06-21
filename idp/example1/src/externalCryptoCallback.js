/*
Copyright (c) 2018, 2019 National Digital ID COMPANY LIMITED 

This file is part of NDID software.

NDID is the free software: you can redistribute it and/or modify  it under the terms of the Affero GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

NDID is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public License for more details.

You should have received a copy of the Affero GNU General Public License along with the NDID source code.  If not, see https://www.gnu.org/licenses/agpl.txt.

please contact info@ndid.co.th for any further questions
*/

import * as API from './api';

import * as config from './config';

if (config.useExternalCryptoService) {
  const EXTERNAL_CRYPTO_SERVICE_IP =
    process.env.EXTERNAL_CRYPTO_SERVICE_IP || 'localhost';
  const EXTERNAL_CRYPTO_SERVICE_PORT =
    process.env.EXTERNAL_CRYPTO_SERVICE_PORT || 12000;

  (async () => {
    for (;;) {
      try {
        await API.setDpkiCallbackUrl({
          sign_url: `http://${EXTERNAL_CRYPTO_SERVICE_IP}:${EXTERNAL_CRYPTO_SERVICE_PORT}/dpki/sign`,
          decrypt_url: `http://${EXTERNAL_CRYPTO_SERVICE_IP}:${EXTERNAL_CRYPTO_SERVICE_PORT}/dpki/decrypt`,
        });
        await API.setDpkiCallbackUrlMaster({
          url: `http://${EXTERNAL_CRYPTO_SERVICE_IP}:${EXTERNAL_CRYPTO_SERVICE_PORT}/dpki/master/sign`,
        });
        break;
      } catch (error) {
        console.error('Error setting DPKI callback URL at NDID API', error);
      }
      // simple wait
      await new Promise((resolve, reject) => setTimeout(resolve, 5000)); // wait for 5 seconds
    }
  })();
}
