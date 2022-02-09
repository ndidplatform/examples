FROM node:12-alpine as build

COPY idp/api_v5/example1/package*.json /examples/idp/
COPY rp/api_v5/example1/package*.json /examples/rp/
COPY as/api_v5/example1/package*.json /examples/as/
COPY external_crypto_service/example1/package*.json /examples/dpki/

RUN apk update && apk add --no-cache --virtual .build-deps python3 make g++
RUN cd /examples/idp && npm install && \
    cd /examples/rp && npm install && \
    cd /examples/as && npm install && \
    cd /examples/dpki && npm install 
RUN apk del .build-deps


FROM node:12-alpine

ENV TERM=xterm-256color

RUN apk update && apk add --no-cache bash openssl

WORKDIR /examples

COPY idp/api_v5/example1 /examples/idp
COPY rp/api_v5/example1 /examples/rp
COPY as/api_v5/example1 /examples/as
COPY external_crypto_service/example1 /examples/dpki

COPY docker/start-node.sh /examples

COPY --from=build /examples/idp/node_modules /examples/idp/node_modules
COPY --from=build /examples/rp/node_modules /examples/rp/node_modules
COPY --from=build /examples/as/node_modules /examples/as/node_modules
COPY --from=build /examples/dpki/node_modules /examples/dpki/node_modules

ENTRYPOINT ["./start-node.sh"]
