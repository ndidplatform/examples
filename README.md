## Run in Docker
Required
- Docker CE 17.06+ [Install docker](https://docs.docker.com/install/)
- docker-compose 1.14.0+ [Install docker-compose](https://docs.docker.com/compose/install/)

### Build

```
./docker/build.sh
```

### Run

```
docker-compose -f docker/docker-compose.yml up
```

Then you can access idp-example at http://localhost:8000/ and rp-example at http://localhost:8001/
