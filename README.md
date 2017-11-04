discord-playtime
=========
A discord bot intended to track playtime. Written for nodejs and based on discord.js.

[![Build Status](https://travis-ci.org/thiemok/discord-playtime.svg?branch=master)](https://travis-ci.org/thiemok/discord-playtime)
[![Dependency status](https://david-dm.org/thiemok/discord-playtime.svg)](https://david-dm.org/thiemok/discord-playtime)
[![Coverage Status](https://coveralls.io/repos/github/thiemok/discord-playtime/badge.svg?branch=master)](https://coveralls.io/github/thiemok/discord-playtime?branch=master)

## Overview
This bot allows you and your guild to track which games are most popular and who plays the most.
It allows you to view a overview of your guilds statistics as well as fetch stats per game or player.

Available commands are:
* Overview: Prints a summary of your guilds statistics
* UserStats <diplayName>: Prints detailed stats on the player with the given display name
* GameStats <game>: Prints detailed stats on the given game
* Help

All commands are prefixed by your configured `COMMAND_PREFIX`

### Setup
* clone the repo
* run `yarn install`
* copy `config.json.default` to `config.json` and fill in your options
* start the bot with `yarn start` and use the generated link to add the bot to your server

### Running on Docker
* Use the following environment variables to configure the bot: `DISCORD_TOKEN, MONGO_URL, COMMAND_PREFIX, mashapeKey, HEALTHCHECK, HEALTHCHECK_PORT`
