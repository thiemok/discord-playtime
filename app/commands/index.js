// @flow
import exportJSON from 'commands/export';
import gameStats from 'commands/gameStats';
import { help, unknownCmd } from 'commands/misc';
import overview from 'commands/overview';
import userStats from 'commands/userStats';
import logging from 'util/log';
import type DBConnector from '../database';
import type { Client, GuildMember, Message, TextChannel } from 'discord.js';
import type { Config } from '../index';

const logger = logging('playtime:commands');

const commands = {
	Overview: overview,
	UserStats: userStats,
	GameStats: gameStats,
	Help: help,
	UnknownCmd: unknownCmd,
	ExportJSON: exportJSON,
};

/**
 * Handles incoming commands, by mapping them to their handler functions
 * and sending the generated responde to the commands channel
 * @param  {Object} msg    The message which contains the command
 * @param  {Object} client The discord.js client
 * @param  {Object} db     The db connector
 * @param  {Object} cfg    The bot config
 */
function handleCommand(msg: Message, client: Client, db: DBConnector, cfg: Config) {
	logger.debug('Detected command\n%s', msg.content);
	const args = msg.content.split(/\s+/g);

	const context = {
		db,
		serverID: msg.guild.id,
		client,
		member: msg.member,
		cfg,
	};

	const cmd = args[0].replace(cfg.commandPrefix, '');
	let command = commands[cmd];
	if (!command) {
		command = commands.UnknownCmd;
	}

	command(args.slice(1), context)
		.then((payload) => {
			// $FlowIssue: Needs to be fixed in flow-typed
			(msg.channel: TextChannel).send(payload);
		}).catch(error => logger.error(error));
}

export default handleCommand;
export type CommandContext = {
	db: DBConnector,
	serverID: string,
	client: Client,
	member: GuildMember,
	cfg: Config,
};
