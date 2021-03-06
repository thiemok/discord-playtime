// @flow
import logging from 'util/log';
import type { CommandContext, CommandResult } from 'commands';

const logger = logging('playtime:commands:misc');
/**
 * Generates a help message
 * @param  {string[]}        argv    The args of the command, currently unused
 * @param  {CommandContext}  context The context in which to generate the message
 * @return {CommandResult}           Resolves when the export has finished, with a sendable object
 */
export const help = (argv: Array<string>, context: CommandContext): CommandResult => {
	logger.debug('Running cmd help');
	const { cfg } = context;
	const pResult = new Promise((resolve, reject) => {
		const prefix = cfg.commandPrefix;
		let msg: string = '__**Help**__\n';
		msg += '\n';
		msg += '**Available commands:**\n';
		msg += prefix + 'Overview: *Displays the 5 top players and games*\n';
		msg += prefix + 'UserStats <username>: *Displays detailed statistics about the given user*\n';
		msg += prefix + 'GameStats <game>: *Displays detailed statistics about the given game*\n';
		msg += prefix + 'ExportJSON: *Exports collected data in JSON format*';

		resolve([msg]);
	});
	return pResult;
};

/**
 * Generates a message to inform the user that the entered command is unknown
 * @param  {string[]}        argv    The args of the command, currently unused
 * @param  {CommandContext}  context The context in which to generate the message
 * @return {CommandResult}           Resolves when the export has finished, with a sendable object
 */
export const unknownCmd = (argv: Array<string>, context: CommandContext): CommandResult => {
	logger.debug('Running cmd unknownCmd');
	const { cfg } = context;
	const pResult = new Promise((resolve, reject) => {
		resolve(['`I do not know that command! Please use ' + cfg.commandPrefix + 'Help to list available commands.`']);
	});
	return pResult;
};
