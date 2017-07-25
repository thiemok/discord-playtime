import Discord from 'discord.js';

import DBConnector from './database.js';
import Updater from './updater.js';
import handleCommand from './commands.js';

const bot = new Discord.Client(
	{
		fetchAllMembers: true,
		disabledEvents: ['TYPING_START'],
	}
);

const config = getConfig();
const db = new DBConnector(config.dbUrl);
const dbUpdater = new Updater(bot, db);
const requiredPermissions = ['SEND_MESSAGES'];

function getConfig() {
	let cfg;

	try {
		cfg = require('../config.json');
		// Set mashape api key for igdb game scraping
		global.mashapeKey = cfg.mashapeKey;
	} catch (err) {
		const { DISCORD_TOKEN, MONGO_URL, COMMAND_PREFIX } = process.env;
		// Reading config failed using ENV
		cfg = {
			token: DISCORD_TOKEN,
			dbUrl: MONGO_URL,
			commandPrefix: COMMAND_PREFIX,
		};
	}

	return cfg;
}

// Message Handling
bot.on('message', (msg) => {
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

	bot.prependOnceListener('ready', () => {
		bot.generateInvite(requiredPermissions)
		.then((link) => {
			/* eslint-disable no-console */
			console.log('Add me to your server using this link:');
			console.log(link);
			/* eslint-enable no-console */
		})
		.catch(err => console.error(err));
	});

	bot.on('ready', () => {
		console.log(`Logged in as ${bot.user.username}!`);

		// Set presence
		const presence = bot.user.presence;
		presence.game = { name: 'Big Brother', url: null };
		bot.user.setPresence(presence);

		// Start updating now
		dbUpdater.start();
	});

	bot.login(config.token);
} catch (err) {
	/* eslint-disable no-console */
	console.error(err);
	/* eslint-enable no-console */
}

/* eslint-disable no-console */
function gracefulExit() {
	console.log('(⌒ー⌒)ﾉ');

	dbUpdater.stop(() => {
		bot.destroy();
		process.exit();
	});
}

function uncaughtException(err) {
	// We can't close sessions here since it async
	console.log('(╯°□°）╯︵ ┻━┻');
	// Log error
	console.log(err);
	console.log(err.stack);
	// Logout
	bot.destroy();
}
/* eslint-enable no-console */

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
process.on('uncaughtException', uncaughtException);
