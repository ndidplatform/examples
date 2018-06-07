FROM node:8-alpine as build

COPY idp/example1/package*.json /examples/idp/
COPY rp/example1/package*.json /examples/rp/
COPY as/example1/package*.json /examples/as/

RUN apk update && apk add --no-cache --virtual .build-deps python make g++
RUN cd /examples/idp && npm install && \
    cd /examples/rp && npm install && \
    cd /examples/as && npm install
RUN apk del .build-deps


FROM node:8-alpine

ENV TERM=xterm-256color

RUN apk update && apk add --no-cache bash openssl

WORKDIR /examples

COPY idp/example1 /examples/idp
COPY rp/example1 /examples/rp
COPY as/example1 /examples/as

COPY docker/start-node.sh /examples

COPY --from=build /examples/idp/node_modules /examples/idp/node_modules
COPY --from=build /examples/rp/node_modules /examples/rp/node_modules
COPY --from=build /examples/as/node_modules /examples/as/node_modules

ENTRYPOINT ["./start-node.sh"]
