// @flow
import * as Discord from 'discord.js';
import DBConnector from './database';
import Updater from './updater';
import handleCommand from 'commands';
import HealthcheckEndpoint from './healthcheckEndpoint';
import logging from 'util/log';

const logger = logging('playtime:main');

export type Config = {
	token: string,
	dbUrl: string,
	commandPrefix: string,
	healthcheck: boolean,
	healthcheckPort: number,
};

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


function getConfig(): Config {
	let cfg: Config;

	try {
		// This is hopefully replaced with a unified config method SOON(tm).
		// $FlowIssue Yes this may fail flow, thats why its wrapped in error handling
		cfg = require('../config.json');
		// Set mashape api key for igdb game scraping
		global.mashapeKey = cfg.mashapeKey;
	} catch (err) {
		// Reading config failed using ENV
		const {
			DISCORD_TOKEN,
			MONGO_URL,
			COMMAND_PREFIX,
			HEALTHCHECK,
			HEALTHCHECK_PORT,
		} = process.env;
		if (DISCORD_TOKEN && MONGO_URL) {
			cfg = {
				token: DISCORD_TOKEN,
				dbUrl: MONGO_URL,
				commandPrefix: (COMMAND_PREFIX || '!gt'),
				healthcheck: (HEALTHCHECK != null && HEALTHCHECK.toLowerCase === 'true'),
				healthcheckPort: (parseInt(HEALTHCHECK_PORT) || 3000),
			};
		} else {
			throw new Error('Failed to load required configuration options');
		}
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
		client.user.setPresence({ game: { name: 'Big Brother' } });

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
