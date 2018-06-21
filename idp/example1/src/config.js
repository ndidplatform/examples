/*
Copyright (c) 2018, 2019 National Digital ID COMPANY LIMITED 

This file is part of NDID software.

NDID is the free software: you can redistribute it and/or modify  it under the terms of the Affero GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

NDID is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public License for more details.

You should have received a copy of the Affero GNU General Public License along with the NDID source code.  If not, see https://www.gnu.org/licenses/agpl.txt.

please contact info@ndid.co.th for any further questions
*/

import { spawnSync } from 'child_process';

if(process.env.PERSISTENT_PATH) {
  if(process.env.PERSISTENT_PATH[process.env.PERSISTENT_PATH.length - 1] !== '/')
    process.env.PERSISTENT_PATH += '/';
}
else process.env.PERSISTENT_PATH = './persistent_db/';

spawnSync('mkdir',['-p',process.env.PERSISTENT_PATH]);

export const dbName = process.env.DB_NAME || 'db.json';
export const keyPath = 
  process.env.KEY_PATH 
  || process.env.PERSISTENT_PATH + 'dev_user_key/';
export const dbPath = process.env.PERSISTENT_PATH + dbName;

export const useExternalCryptoService =
  process.env.USE_EXTERNAL_CRYPTO_SERVICE === 'true' ? true : false;