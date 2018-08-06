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
          master_sign_url: `http://${EXTERNAL_CRYPTO_SERVICE_IP}:${EXTERNAL_CRYPTO_SERVICE_PORT}/dpki/master/sign`,
          decrypt_url: `http://${EXTERNAL_CRYPTO_SERVICE_IP}:${EXTERNAL_CRYPTO_SERVICE_PORT}/dpki/decrypt`,
        });
        console.log('=== DPKI callback set OK ===');
        break;
      } catch (error) {
        console.error('Error setting DPKI callback URL at NDID API, retrying...', error);
      }
      // simple wait
      await new Promise((resolve, reject) => setTimeout(resolve, 5000)); // wait for 5 seconds
    }
  })();
}
