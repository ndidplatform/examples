import 'source-map-support/register';

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import express from 'express';
import bodyParser from 'body-parser';

const SERVER_PORT = process.env.SERVER_PORT || 12000;

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

const app = express();

/**
 *
 * @param {(Object|string)} privateKey
 * @param {string} ciphertext base64 encoded ciphertext
 * @returns {Buffer} decrypted text
 */
function privateDecrypt(privateKey, ciphertext) {
  const buffer = Buffer.from(ciphertext, 'base64');
  const decrypted = crypto.privateDecrypt(privateKey, buffer);
  return decrypted;
}

function createSignature(privateKey, hashMethod, message) {
  return crypto
    .createSign(hashMethod)
    .update(message)
    .sign(privateKey, 'base64');
}

app.use(bodyParser.json({ limit: '2mb' }));

// app.post('/unsafe_set_priv_key/', async (req, res) => {
//   const { node_id, priv_key } = req.body;
// });

app.post('/dpki/decrypt', async (req, res) => {
  try {
    const { node_id, encrypted_message, key_type } = req.body;

    const keyPath = path.join(__dirname, '..', 'devKey', node_id);

    const key = fs.readFileSync(keyPath, 'utf8').toString();

    const decryptedMessageBuffer = privateDecrypt(key, encrypted_message);

    const decryptedMessageBase64 = decryptedMessageBuffer.toString('base64');

    res.status(200).json({
      decrypted_message: decryptedMessageBase64,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/dpki/sign', async (req, res) => {
  try {
    const {
      node_id,
      request_message,
      request_message_hash,
      hash_method,
      key_type,
      sign_method,
    } = req.body;

    const keyPath = path.join(__dirname, '..', 'devKey', node_id);

    const key = fs.readFileSync(keyPath, 'utf8').toString();

    // Optional: Check hash equality

    // Hash then encrypt OR encrypt received hash
    const signature = createSignature(key, hash_method, request_message);

    res.status(200).json({
      signature,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/dpki/master/sign', async (req, res) => {
  try {
    const {
      node_id,
      request_message,
      request_message_hash,
      hash_method,
      key_type,
      sign_method,
    } = req.body;

    const keyPath = path.join(__dirname, '..', 'devKey', node_id + '_master');

    const key = fs.readFileSync(keyPath, 'utf8').toString();

    // Optional: Check hash equality

    // Hash then encrypt OR encrypt received hash
    const signature = createSignature(key, hash_method, request_message);

    res.status(200).json({
      signature,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`Listening to NDID DPKI calls on port ${SERVER_PORT}`);
});
