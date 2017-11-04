COMMIT_HASH = $(shell git rev-parse HEAD)
DIRNAME = $(shell basename `git rev-parse --show-toplevel`)

docker:
				docker build --no-cache -t ${DIRNAME}:${COMMIT_HASH} -t ${DIRNAME}:develop .

install:
				yarn install

test: lint
				yarn run test

test-watch: lint
				yarn run test-watch

lint:
				yarn run lint

run:
				yarn run start

build:
				yarn run build

clean:
				rm -rf build
