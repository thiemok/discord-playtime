// @flow
import exportJSON from 'commands/export';
import gameStats from 'commands/gameStats';
import { help, unknownCmd } from 'commands/misc';
import overview from 'commands/overview';
import userStats from 'commands/userStats';
import logging from 'util/log';
import type { ColorResolvable, Client, GuildMember, Message, TextChannel, RichEmbed } from 'discord.js';
import type { Config } from '../index';

const logger = logging('playtime:commands');

export type CommandContext = {
	serverID: string,
	client: Client,
	member: GuildMember,
	cfg: Config,
	color: ColorResolvable,
};

type Sendable = string | { embed: RichEmbed };
export type CommandResult = Promise<Sendable[]>;
export type Command = (Array<string>, CommandContext) => CommandResult;

const commands: { [string]: Command } = {
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
const handleCommand = (msg: Message, client: Client, cfg: Config) => {
	logger.debug('Detected command\n%s', msg.content);
	const args = msg.content.split(/\s+/g);

	const clientMember = msg.guild.members.get(client.user.id);

	const context = {
		serverID: msg.guild.id,
		client,
		member: msg.member,
		cfg,
		color: clientMember ? clientMember.highestRole.color : 'DEFAULT',
	};

	const cmd = args[0].replace(cfg.commandPrefix, '');
	let command: ?Command = commands[cmd];
	if (!command) {
		command = commands.UnknownCmd;
	}

	command(args.slice(1), context)
		.then((payloads) => {
			payloads.forEach((payload) => {
				// $FlowIssue: Needs to be fixed in flow-typed
				(msg.channel: TextChannel).send(payload);
			});
		}).catch(error => logger.error(error));
};

export default handleCommand;
