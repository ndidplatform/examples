#!/bin/bash
git clone https://github.com/ndidplatform/smart-contract.git &&
git clone https://github.com/ndidplatform/api.git &&
git clone https://github.com/ndidplatform/examples.git &&
cd smart-contract &&
git checkout add-docker &&
docker build -t ndidplatform/tendermint:0.16.0 -f Dockerfile-tendermint . &&
docker build -t ndidplatform/smart-contract -f Dockerfile-abci . &&
cp -R docker-config ../docker-config &&
cd ../api &&
git checkout add-docker &&
docker build -t ndidplatform/api -f Dockerfile . &&
cd ../examples &&
git checkout add-docker && cd docker && cp * ../ && cd ..
docker build -t ndidplatform/idp-examples -f Dockerfile-idp . &&
docker build -t ndidplatform/rp-examples -f Dockerfile-rp . &&
docker build -t ndidplatform/as-examples -f Dockerfile-as . &&
cd .. &&
rm -r smart-contract &&
rm -r api &&
rm -r examples \