/*
Copyright (c) 2018, 2019 National Digital ID COMPANY LIMITED 

This file is part of NDID software.

NDID is the free software: you can redistribute it and/or modify  it under the terms of the Affero GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

NDID is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public License for more details.

You should have received a copy of the Affero GNU General Public License along with the NDID source code.  If not, see https://www.gnu.org/licenses/agpl.txt.

please contact info@ndid.co.th for any further questions
*/

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

export const sendData = async ({
  request_id,
  service_id,
  data,
}) => {
  try {
    const response = await fetch(`${apiServerAddress}/as/data/${request_id}/${service_id}`, {
      method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({data}),
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