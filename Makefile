COMMIT_HASH = $(shell git rev-parse HEAD)
DIRNAME = $(shell basename `git rev-parse --show-toplevel`)

docker:
				docker build --no-cache -t ${DIRNAME}:${COMMIT_HASH} .

install:
				yarn install

test:
				node_modules/jest/bin/jest.js

run:
				node index.js
