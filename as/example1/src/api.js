import fetch from 'node-fetch';

const apiServerAddress =
  process.env.API_SERVER_ADDRESS || 'http://localhost:8082';

/*export const getCallbackUrl = async () => {
  try {
    const response = await fetch(`${apiServerAddress}/as/callback`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw response;
    }
    let responseJson = await response.json();

    return responseJson;
  } catch (error) {
    throw error;
  }
};*/

export const registerAsService = async ({
  url,
  service_id,
  service_name,
  min_ial,
  min_aal,
}) => {
  try {

    const response = await fetch(`${apiServerAddress}/as/service/${service_id}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        service_id,
        service_name,
        min_ial,
        min_aal,
      }),
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        throw errorJson;
      }
      throw response;
    }

    return;
  } catch (error) {
    throw error;
  }
};

export const setDpkiCallbackUrl = async ({ sign_url, decrypt_url }) => {
  try {
    const response = await fetch(`${apiServerAddress}/dpki/node/register_callback`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sign_url,
        decrypt_url,
      }),
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        throw errorJson;
      }
      throw response;
    }

    // let responseJson = await response.json();

    // return responseJson;
    return;
  } catch (error) {
    throw error;
  }
};

export const setDpkiCallbackUrlMaster = async ({ url }) => {
  try {
    const response = await fetch(`${apiServerAddress}/dpki/node/register_callback_master`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
      }),
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        throw errorJson;
      }
      throw response;
    }

    // let responseJson = await response.json();

    // return responseJson;
    return;
  } catch (error) {
    throw error;
  }
};