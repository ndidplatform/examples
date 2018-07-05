import { spawnSync } from 'child_process';

export const ndidApiCallbackIp =
  process.env.NDID_API_CALLBACK_IP || 'localhost';
export const ndidApiCallbackPort = process.env.NDID_API_CALLBACK_PORT || 5002;

if (process.env.PERSISTENT_PATH) {
  if (
    process.env.PERSISTENT_PATH[process.env.PERSISTENT_PATH.length - 1] !== '/'
  )
    process.env.PERSISTENT_PATH += '/';
} else process.env.PERSISTENT_PATH = './persistent_db/';

spawnSync('mkdir', ['-p', process.env.PERSISTENT_PATH]);

export const dbName = process.env.DB_NAME || 'db.json';
export const keyPath =
  process.env.KEY_PATH || process.env.PERSISTENT_PATH + 'dev_user_key/';
export const dbPath = process.env.PERSISTENT_PATH + dbName;

export const useExternalCryptoService =
  process.env.USE_EXTERNAL_CRYPTO_SERVICE === 'true' ? true : false;
