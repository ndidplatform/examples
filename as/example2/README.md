# NDID Example client app (AS)

## Prerequisites

* Node.js 8.9 or later
* npm 5.6.0 or later

## Getting started

1.  Install dependencies

    ```
    npm install
    ```
2.  Run a server

    ```
    npm start
    ```

    **Environment variable options**
    * `API_SERVER_ADDRESS`: An address (`http://IP:PORT`) of NDID API server [Default: `http://localhost:8082`].
    * `NDID_API_CALLBACK_IP`: IP address for NDID server to send callback. [Default: `localhost`]
    * `NDID_API_CALLBACK_PORT`: Port for NDID server to send callback. [Default: `5003`]
    * `USE_EXTERNAL_CRYPTO_SERVICE`: [Default: `false`]
    * `EXTERNAL_CRYPTO_SERVICE_IP`: [Default: `localhost`]
    * `EXTERNAL_CRYPTO_SERVICE_PORT`: [Default: `12000`]

    **Examples**
    * Run a client app server

        ```
        API_SERVER_ADDRESS=http://localhost:8082 \
        NDID_API_CALLBACK_IP=localhost \
        NDID_API_CALLBACK_PORT=5003 \
        npm start
        ```
