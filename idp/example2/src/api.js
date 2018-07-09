import fetch from 'node-fetch';

const apiServerAddress =
  process.env.API_SERVER_ADDRESS || 'http://localhost:8081';

const apiBaseUrl = apiServerAddress + '/v2';

function logResponse(url, method, status, body, error) {
  console.log(
    `Received response from NDID API:
    URL: ${url} (${method})
    Status: ${status}\
    ${body ? '\nBody:\n' + JSON.stringify(body, null, 2) : ''}\
    ${error ? '\nError:\n' + JSON.stringify(error, null, 2) : ''}`
  );
}

export async function httpGet(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        logResponse(url, 'GET', response.status, null, errorJson);
        throw errorJson;
      }
      throw response;
    }

    const responseJson = await response.json();
    logResponse(url, 'GET', response.status, responseJson);

    return responseJson;
  } catch (error) {
    throw error;
  }
}

export async function httpPost(url, body, expectResponseBody) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (
        response.status === 400 ||
        response.status === 500 ||
        response.status === 403
      ) {
        const errorJson = await response.json();
        logResponse(url, 'POST', response.status, null, errorJson);
        throw errorJson;
      }
      throw response;
    }

    if (expectResponseBody) {
      const responseJson = await response.json();
      logResponse(url, 'POST', response.status, responseJson);
      return responseJson;
    }
    logResponse(url, 'POST', response.status);
  } catch (error) {
    throw error;
  }
}

export function registerAccessorCallback(url) {
  return httpPost(`${apiBaseUrl}/idp/accessor/callback`, {
    url,
  });
}

export function getCallbackUrls() {
  return httpGet(`${apiBaseUrl}/idp/callback`);
}

export function setCallbackUrls({
  incoming_request_url,
  accessor_sign_url,
  error_url,
}) {
  return httpPost(`${apiBaseUrl}/idp/callback`, {
    incoming_request_url,
    accessor_sign_url,
    error_url,
  });
}

export function createIdpResponse({
  request_id,
  namespace,
  identifier,
  ial,
  aal,
  secret,
  status,
  signature,
  accessor_id,
  reference_id,
  callback_url,
}) {
  return httpPost(`${apiBaseUrl}/idp/response`, {
    request_id,
    namespace,
    identifier,
    ial,
    aal,
    secret,
    status,
    signature,
    accessor_id,
    reference_id,
    callback_url,
  });
}

export function createNewIdentity(data) {
  return httpPost(`${apiBaseUrl}/identity`, data, true);
}

export function addAccessor(data) {
  return httpPost(
    `${apiBaseUrl}/identity/${data.namespace}/${data.identifier}/accessors`,
    data,
    true
  );
}

export function setDpkiCallbackUrl({ sign_url, master_sign_url, decrypt_url }) {
  return httpPost(`${apiBaseUrl}/dpki/node/callback`, {
    sign_url,
    master_sign_url,
    decrypt_url,
  });
}
