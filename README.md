## Run in Docker
Required
- Docker CE [Install docker](https://docs.docker.com/install/)
- docker-compose [Install docker-compose](https://docs.docker.com/compose/install/)
- git

### Build

```
docker-compose -f docker/docker-compose.build.yml build
```

### Run

```
docker-compose -f docker/docker-compose.yml up
```

Then you can run idp-example at port 8000 and rp-example at port 8001
