import fetch from 'node-fetch';

const apiServerAddress =
  process.env.API_SERVER_ADDRESS || 'http://localhost:8080';

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

export function createRequest({
  mode,
  namespace,
  identifier,
  reference_id,
  idp_list,
  callback_url,
  data_request_list,
  request_message,
  min_ial,
  min_aal,
  min_idp,
  request_timeout,
}) {
  return httpPost(
    `${apiBaseUrl}/rp/requests/${namespace}/${identifier}`,
    {
      mode,
      reference_id,
      idp_list,
      callback_url,
      data_request_list,
      request_message,
      min_ial,
      min_aal,
      min_idp,
      request_timeout,
    },
    true
  );
}

export function getRequest({ requestId }) {
  return httpGet(`${apiBaseUrl}/rp/requests/${requestId}`);
}

export function getDataFromAS({ requestId }) {
  return httpGet(`${apiBaseUrl}/rp/requests/data/${requestId}`);
}

export function closeRequest(body) {
  return httpPost(`${apiBaseUrl}/rp/requests/close`, body);
}

export function setDpkiCallbackUrl({ sign_url, master_sign_url, decrypt_url }) {
  return httpPost(`${apiBaseUrl}/dpki/node/callback`, {
    sign_url,
    master_sign_url,
    decrypt_url,
  });
}
