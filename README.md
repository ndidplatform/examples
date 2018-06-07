## Run in Docker
Required
- Docker CE 17.06+ [Install docker](https://docs.docker.com/install/)
- docker-compose 1.14.0+ [Install docker-compose](https://docs.docker.com/compose/install/)

### Run

```
docker-compose -f docker/docker-compose.yml up
```

### Build

```
./docker/build.sh
```

Then you can access idp-example at http://localhost:8000/ and rp-example at http://localhost:8001/

### Note

* To run docker container without building image, run command show in **Run** section (no building required). It will run docker container with image from Dockerhub (https://hub.docker.com/r/ndidplatform/examples/).
* To pull latest image from Dockerhub, run `docker pull ndidplatform/examples`