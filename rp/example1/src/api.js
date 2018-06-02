import fetch from 'node-fetch';

const apiServerAddress =
  process.env.API_SERVER_ADDRESS || 'http://localhost:8080';

export const createRequest = async ({
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
}) => {
  try {
    const response = await fetch(
      `${apiServerAddress}/rp/requests/${namespace}/${identifier}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_id,
          idp_list,
          callback_url,
          data_request_list,
          request_message,
          min_ial,
          min_aal,
          min_idp,
          request_timeout,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        throw errorJson;
      }
      throw response;
    }

    let responseJson = await response.json();

    return responseJson;
  } catch (error) {
    throw error;
  }
};

export const getRequest = async ({ requestId }) => {
  try {
    const response = await fetch(
      `${apiServerAddress}/rp/requests/${requestId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        throw errorJson;
      }
      throw response;
    }

    let responseJson = await response.json();

    return responseJson;
  } catch (error) {
    throw error;
  }
};

export const getDataFromAS = async ({ requestId }) => {
  try {
    const response = await fetch(
      `${apiServerAddress}/rp/requests/data/${requestId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        throw errorJson;
      }
      throw response;
    }

    let responseJson = await response.json();

    return responseJson;
  } catch (error) {
    throw error;
  }
};