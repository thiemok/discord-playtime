import Discord from 'discord.js';
import DBConnector from './database';
import Updater from './updater';
import handleCommand from './commands';
import logging from 'util/log';

const logger = logging('playtime:main');

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
	logger.debug('disconnected\n%s', event.reason);
});

bot.on('reconnecting', () => {
	logger.debug('reconnecting');
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
			.catch(err => logger.error(err));
	});

	bot.on('ready', () => {
		logger.debug(`Logged in as ${bot.user.username}!`);

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
	logger.debug('(⌒ー⌒)ﾉ');

	dbUpdater.stop(() => {
		bot.destroy();
		process.exit();
	});
}

function uncaughtException(err) {
	// We can't close sessions here since it async
	logger.error('(╯°□°）╯︵ ┻━┻\n%s', err);
	// Logout
	bot.destroy();
}
/* eslint-enable no-console */

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
process.on('uncaughtException', uncaughtException);
