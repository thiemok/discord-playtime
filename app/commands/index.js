import { exportJSON } from './export';
import gameStats from './gameStats';
import { help, unknownCmd } from './misc';
import overview from './overview';
import userStats from './userStats';

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
function handleCommand(msg, client, db, cfg) {
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
		msg.channel.send(payload);
	});
}

export default handleCommand;
