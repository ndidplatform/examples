import fetch from 'node-fetch';

const apiServerAddress =
  process.env.API_SERVER_ADDRESS || 'http://localhost:8082';

const apiBaseUrl = apiServerAddress + '/v2';

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
        throw errorJson;
      }
      throw response;
    }

    const responseJson = await response.json();

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
        throw errorJson;
      }
      throw response;
    }

    if (expectResponseBody) {
      const responseJson = await response.json();
      return responseJson;
    }
  } catch (error) {
    throw error;
  }
}

export function sendData({
  request_id,
  service_id,
  reference_id,
  callback_url,
  data,
}) {
  return httpPost(`${apiBaseUrl}/as/data/${request_id}/${service_id}`, {
    reference_id,
    callback_url,
    data,
  });
}

export function registerAsService({
  service_id,
  reference_id,
  callback_url,
  min_ial,
  min_aal,
  url,
}) {
  return httpPost(`${apiBaseUrl}/as/service/${service_id}`, {
    reference_id,
    callback_url,
    service_id,
    min_ial,
    min_aal,
    url,
  });
}

export function setDpkiCallbackUrl({ sign_url, master_sign_url, decrypt_url }) {
  return httpPost(`${apiBaseUrl}/dpki/node/callback`, {
    sign_url,
    master_sign_url,
    decrypt_url,
  });
}
