/*
Copyright (c) 2018, 2019 National Digital ID COMPANY LIMITED 

This file is part of NDID software.

NDID is the free software: you can redistribute it and/or modify  it under the terms of the Affero GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

NDID is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public License for more details.

You should have received a copy of the Affero GNU General Public License along with the NDID source code.  If not, see https://www.gnu.org/licenses/agpl.txt.

please contact info@ndid.co.th for any further questions
*/

import crypto from 'crypto';
import { spawnSync } from 'child_process';
import fs from 'fs';
import * as config from './config';

export function genNewKeyPair(sid) {
  let pathSid = config.keyPath + sid;
  let gen = spawnSync('openssl', ['genrsa', '-out', pathSid, '2048']);
  //console.log(gen.stderr.toString());
  let encode = spawnSync('openssl', [
    'rsa',
    '-in',
    pathSid,
    '-pubout',
    '-out',
    pathSid + '.pub',
  ]);
  if (gen.status !== 0 || encode.status !== 0) {
    throw new Error('Failed in genNewKeyPair()');
  }
}

export function signMessage(messageToSign, privateKeyPath) {
  let result = spawnSync(
    'openssl',
    ['dgst', '-sha256', '-sign', privateKeyPath],
    { input: messageToSign }
  );
  return result.stdout.toString('base64');
}

export function accessorSign(sid, text) {
  let privateKey = fs.readFileSync(config.keyPath + sid, 'utf8');
  const encrypted = crypto.privateEncrypt(
    privateKey,
    Buffer.from(text, 'base64')
  );
  return encrypted.toString('base64');
}
