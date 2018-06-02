import crypto from 'crypto';
import { spawnSync } from 'child_process';
import bignum from 'bignum';
import fs from 'fs';

function extractParameterFromPrivateKey(privateKey) {
  let fileName = 'tmpNDIDFile' + Date.now();
  fs.writeFileSync(fileName,privateKey);
  let output = spawnSync('openssl',('rsa -in ' + fileName + ' -text -noout').split(' '));
  output = output.stdout.toString().split('\n');

  let ignoreIndex = output.indexOf('prime1:');
  output = output.splice(0,ignoreIndex);
  let privateIndex = output.indexOf('privateExponent:');
  let privateStr = output.splice(privateIndex+1).join('').split(' ').join('').split(':').join('');
  let modStr = output.splice(2,output.length-4).join('').split(' ').join('').split(':').join('');

  console.log(stringToBigInt(Buffer.from(privateStr,'hex').toString('base64')));
  fs.unlink(fileName, () => {});
  return {
    n: stringToBigInt(Buffer.from(modStr,'hex').toString('base64')),
    d: stringToBigInt(Buffer.from(privateStr,'hex').toString('base64'))
  };
}

function powerMod(base, exponent, modulus) {
  return base.powm(exponent, modulus);
}

function stringToBigInt(string) {
  return bignum.fromBuffer(Buffer.from(string,'base64'));
}

function euclideanGCD(a, b) {
  if( a.eq(bignum('0')) ) return [b, bignum('0'), bignum('1')];
  let [g, y, x] = euclideanGCD(b.mod(a),a);
  return [
    g, 
    x.sub(
      b.sub(
        b.mod(a)
      )
      .div(a)
      .mul(y)
    ),
    y
  ];
}

function moduloInverse(a, modulo) {
  let [g, x, y] = euclideanGCD(a, modulo);
  if(!g.eq(1)) throw 'No modular inverse';
  return x.mod(modulo);
}

function inverseHash(hash, mod) {
  let hashBigInt = stringToBigInt(hash);
  let inv = moduloInverse(hashBigInt, mod);
  return inv;
}

export function calculateSecret(namespace, identifier,privateKey) {
  let sid = namespace + ':' + identifier;
  let hash = crypto.createHash('sha256');
  hash.update(sid);
  let hashedSid = hash.digest('base64');

  let { n, d } = extractParameterFromPrivateKey(privateKey);
  let invHash = inverseHash(hashedSid, n);
  let secret = powerMod(invHash,d,n);
  return secret.toBuffer().toString('base64');
}

export function genNewKeyPair(sid) {
  let pathSid = './dev_user_key/' + sid;
  let gen = spawnSync('openssl', ['genrsa', '-out', pathSid, '2048']);
  //console.log(gen.stderr.toString());
  let encode = spawnSync('openssl', ['rsa', '-in', pathSid, '-pubout', '-out', pathSid + '.pub']);
  //console.log(encode.stderr.toString());

  if (gen.status !== 0 || encode.status !== 0) {
    throw new Error("Failed in genNewKeyPair()");
  }
}