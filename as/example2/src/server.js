import 'source-map-support/register';

import * as API from './api';
import { eventEmitter as ndidCallbackEvent } from './callbackHandler';

import { waitForExternalCryptoReady } from './externalCryptoCallback';

import * as config from './config';

(async () => {
  for (;;) {
    try {
      if (!waitForExternalCryptoReady()) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        continue;
      }
      const reference_id = (Date.now() % 100000).toString();
      await API.registerAsService({
        service_id: 'bank_statement',
        reference_id,
        callback_url: `http://${config.ndidApiCallbackIp}:${
          config.ndidApiCallbackPort
        }/as/service`,
        min_ial: 1.1,
        min_aal: 1,
        url: `http://${config.ndidApiCallbackIp}:${
          config.ndidApiCallbackPort
        }/as/service/bank_statement`,
      });
      break;
    } catch (error) {
      if (error.error && error.error.code === 25005) break;
      console.error('Error registering service', error);
    }
    // simple wait
    await new Promise((resolve, reject) => setTimeout(resolve, 5000)); // wait for 5 seconds
  }
})();

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

ndidCallbackEvent.on('callback', function(data) {
  if (data.type === 'data_request') {
    sendData(data);
  } else if (data.type === 'add_or_update_service_result') {
    if (data.success) {
      console.log('Successfully add or update service');
    } else {
      console.error('Add or update service ERROR', data.error);
    }
  } else if (data.type === 'send_data_result') {
    if (data.success) {
      console.log('Successfully send data');
    } else {
      console.error('Send data ERROR', data.error);
    }
  } else if (data.type === 'error') {
    // TODO: callback when using async createRequest and got error
  } else {
    console.error('Unknown callback type', data);
    return;
  }
});

async function sendData({ service_id, request_id }) {
  const reference_id = (Date.now() % 100000).toString();
  //=================== Real business logic here ========================
  //
  try {
    await API.sendData({
      reference_id,
      callback_url: `http://${config.ndidApiCallbackIp}:${
        config.ndidApiCallbackPort
      }/as/data`,
      service_id,
      request_id,
      data: 'Mock data async',
    });
  } catch (error) {
    console.error('Error sending data', error);
  }
}

console.log('AS Server is running.');
