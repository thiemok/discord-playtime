discord-playtime
=========
A discord bot intended to track playtime. Written for nodejs and based on discord.js.

![CI status](https://travis-ci.org/thiemok/discord-playtime.svg?branch=master)

### Setup
* clone the repo
* run `yarn install`
* copy `config.json.default` to `config.json` and fill in your options
* start the bot with `yarn start` and use the generated link to add the bot to your server

### Running on Docker
* Use the following environment variables to configure the bot: `DISCORD_TOKEN, MONGO_URL, COMMAND_PREFIX, mashapeKey`
