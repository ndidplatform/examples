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

export const setCallbackUrl = async ({
  url,
  service_id,
  service_name,
  min_ial,
  min_aal,
}) => {
  try {

    const response = await fetch(`${apiServerAddress}/as/callback`, {
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
      throw response;
    }

    return;
  } catch (error) {
    throw error;
  }
};
