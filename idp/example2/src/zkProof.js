import crypto from 'crypto';
import { spawnSync } from 'child_process';
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

export function privateEncrypt(message, privateKey) {
  return crypto.privateEncrypt({
    key: privateKey,
    padding: crypto.constants.RSA_NO_PADDING,
  },Buffer.from(message, 'base64')).toString('base64');
}
