#!/bin/sh

usage() {
  echo "Usage: $(basename $0) mode"
  echo "mode = idp|rp|as"
}

MODE=$1
case $MODE in
  idp|rp|as)
    cd $MODE
    npm start
    ;;
  *)
    usage
    exit 1
    ;;
esac