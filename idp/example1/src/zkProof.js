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
