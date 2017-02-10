const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require('fs');

const DBConnector = require("./database.js");
const Updater = require("./updater.js");

var data = fs.readFileSync('./config.json');
var config;
var db;
var dbUpdater;
var requiredPermissions = ['SEND_MESSAGES'];
var updateInterval = 60 * 1000

function setup() {
	updateInterval = config.updateInterval * 1000;
    db = new DBConnector(config.dbUrl);
    dbUpdater = new Updater(bot, db, config.updateInterval);
}

function logUserState() {
	console.log('fetching data');
    dbUpdater.updateStats();
	setTimeout(logUserState, updateInterval);
}

/*
//Message Handling
bot.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});
*/

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.username}!`);
  var invitePromise = bot.generateInvite(requiredPermissions);
  invitePromise.then(function (link) {
  	console.log(link);
  });
});

try {
    config = JSON.parse(data);
    console.dir(config);
    
    setup();

    bot.login(config.token);
    setTimeout(logUserState, updateInterval);
}
catch (err) {
    console.log(err);
}