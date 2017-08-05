import Discord from 'discord.js';
import DBConnector from './database';
import Updater from './updater';
import handleCommand from './commands';
import HealthcheckEndpoint from './healthcheckEndpoint';
import logging from 'util/log';

const logger = logging('playtime:main');


const client = new Discord.Client(
	{
		fetchAllMembers: true,
		disabledEvents: ['TYPING_START'],
	}
);

const config = getConfig();
const db = new DBConnector(config.dbUrl);
const dbUpdater = new Updater(client, db);
const requiredPermissions = ['SEND_MESSAGES'];

// Healthcheck endpoint, only run in docker environments or with enabled healthchecks
if (config.healthcheck) {
	const healthcheckEndpoint = new HealthcheckEndpoint(client, db);
	healthcheckEndpoint.listen(config.healthcheckPort);
}


function getConfig() {
	let cfg;

	try {
		cfg = require('../config.json');
		// Set mashape api key for igdb game scraping
		global.mashapeKey = cfg.mashapeKey;
	} catch (err) {
		const {
			DISCORD_TOKEN,
			MONGO_URL,
			COMMAND_PREFIX,
			HEALTHCHECK,
			HEALTHCHECK_PORT,
		} = process.env;
		// Reading config failed using ENV
		cfg = {
			token: DISCORD_TOKEN,
			dbUrl: MONGO_URL,
			commandPrefix: COMMAND_PREFIX,
			healthcheck: HEALTHCHECK.toLowerCase() === 'true',
			healthcheckPort: parseInt(HEALTHCHECK_PORT) || 3000,
		};
	}

	return cfg;
}

// Message Handling
client.on('message', (msg) => {
	if (msg.content.startsWith(config.commandPrefix)) {
		handleCommand(msg, client, db, config);
	}
});

client.on('disconnect', (event) => {
	dbUpdater.stop();
	logger.debug('disconnected\n%s', event.reason);
});

client.on('reconnecting', () => {
	logger.debug('reconnecting');
});

try {

	client.prependOnceListener('ready', () => {
		client.generateInvite(requiredPermissions)
			.then((link) => {
			/* eslint-disable no-console */
				console.log('Add me to your server using this link:');
				console.log(link);
			/* eslint-enable no-console */
			})
			.catch(err => logger.error(err));
	});

	client.on('ready', () => {
		logger.debug(`Logged in as ${client.user.username}!`);

		// Set presence
		const presence = client.user.presence;
		presence.game = { name: 'Big Brother', url: null };
		client.user.setPresence(presence);

		// Start updating now
		dbUpdater.start();
	});

	client.login(config.token);
} catch (err) {
	/* eslint-disable no-console */
	console.error(err);
	/* eslint-enable no-console */
}
/* eslint-disable no-console */
function gracefulExit() {
	logger.debug('(⌒ー⌒)ﾉ');

	dbUpdater.stop(() => {
		client.destroy();
		process.exit();
	});
}

function uncaughtException(err) {
	// We can't close sessions here since it async
	logger.error('(╯°□°）╯︵ ┻━┻\n%s', err);
	// Logout
	client.destroy();
}
/* eslint-enable no-console */

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
process.on('uncaughtException', uncaughtException);
