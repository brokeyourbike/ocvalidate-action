#!/bin/sh

if [ -z "$1" ]; then
  echo "Must supply 'OpenCore' version argument"
  exit 1
fi

ocvalidate_version="$(ocvalidate --version)"
echo "Found 'ocvalidate' version '$ocvalidate_version'"

if [ -z "$(echo $ocvalidate_version | grep $1)" ]; then
  echo "Unexpected version :("
  exit 1
fi
