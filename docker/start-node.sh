#!/bin/sh

usage() {
  echo "Usage: $(basename $0) mode"
  echo "mode = idp|rp|as|dpki"
}

MODE=$1
case $MODE in
  idp|rp|as|dpki)
    cd $MODE
    npm start
    ;;
  *)
    usage
    exit 1
    ;;
esac