'use strict';

const Discord = require("discord.js");
const bot = new Discord.Client({'fetchAllMembers': true, 'disabledEvents': ['TYPING_START']});
const fs = require('fs');

const DBConnector = require("./database.js");
const Updater = require("./updater.js");
const handleCommand = require("./commands.js");

var data = fs.readFileSync('./config.json');
var config;
var db;
var dbUpdater;
var requiredPermissions = ['SEND_MESSAGES'];

function setup() {
    db = new DBConnector(config.dbUrl);
    dbUpdater = new Updater(bot, db);
}

//Message Handling
bot.on('message', msg => {
  if (msg.content.startsWith(config.commandPrefix)) {
    handleCommand(msg, bot, db, config);
  }
});

bot.on('disconnect', (event) => {
    dbUpdater.stop();
    console.log('disconnected');
    console.log(event.reason);
});

bot.on('reconnecting', () => {
    console.log('reconnecting');
});

try {
    config = JSON.parse(data);

    bot.prependOnceListener('ready', () => {
        setup();
        var invitePromise = bot.generateInvite(requiredPermissions);
        invitePromise.then((link) => {
            console.log('Add me to your server using this link:');
            console.log(link);
        });
    });

    bot.on('ready', () => {
        console.log(`Logged in as ${bot.user.username}!`);
    
        //Set presence
        let presence = bot.user.presence;
        presence.game = { name: "Big Brother", url: null};
        bot.user.setPresence(presence);

        //Start updating now
        dbUpdater.start();
    });

    bot.login(config.token);
}
catch (err) {
    console.log(err);
}

function gracefulExit() {
    console.log('(⌒ー⌒)ﾉ');
    //TODO: this needs to be synchronus to work
    dbUpdater.stop(() => {
        bot.destroy();
        process.exit();
    });
};

function uncaughtException(err) {
    //We can't close sessions here since it async
    console.log('(╯°□°）╯︵ ┻━┻');
    //Log error
    console.log(err);
    console.log(err.stack);
    //Logout
    bot.destroy();
};

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit)
process.on('uncaughtException', uncaughtException);