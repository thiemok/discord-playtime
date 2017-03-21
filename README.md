discord-playtime
=========
A discord bot intended to track playtime. Written for nodejs and based on discord.js.


### Requirements
* nodejs
* discord.js
* caolan/async
* mongodb
* igdb (optional, used to add aditional game information to reports. Add a mashApe API key to the config.json to use this)

### Setup
* clone the repo
* run `npm install`
* copy `config.json.default` to `config.json` and fill in your options
* start the bot with `npm start` and use the generated link to add the bot to your server

### Running on Docker
* Use the following environment variables to configure the bot: `DISCORD_TOKEN, MONGO_URL, COMMAND_PREFIX, mashapeKey`