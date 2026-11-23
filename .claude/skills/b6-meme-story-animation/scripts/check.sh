#!/usr/bin/env bash
# Report whether the upstream B6 runtime is installed and healthy. Installs nothing.
exec bash "$(dirname "$0")/bootstrap.sh" check "$@"
