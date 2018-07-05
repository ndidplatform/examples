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

export function signMessage(message, privateKey) {
  return crypto
    .createSign('SHA256')
    .update(message)
    .sign(privateKey, 'base64');
}

export function accessorSign(privateKey, text) {
  const encrypted = crypto.privateEncrypt(
    privateKey,
    Buffer.from(text, 'base64')
  );
  return encrypted.toString('base64');
}
