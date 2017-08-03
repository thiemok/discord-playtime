/**
 * Generates a help message
 * @param  {Array|String} argv    The args of the command, currently unused
 * @param  {Object}       context The context in which to generate the message
 * @return {Promise}              Resolves when the export has finished, with a sendable object
 */
const help = (argv, context) => {
	const { cfg } = context;
	const pResult = new Promise(function(resolve, reject) {
		const prefix = cfg.commandPrefix;
		let msg = '__**Help**__\n';
		msg += '\n';
		msg += '**Available commands:**\n';
		msg += prefix + 'Overview: *Displays the 5 top players and games*\n';
		msg += prefix + 'UserStats <username>: *Displays detailed statistics about the given user*\n';
		msg += prefix + 'GameStats <game>: *Displays detailed statistics about the given game*\n';
		msg += prefix + 'ExportJSON: *Exports collected data in JSON format*';

		resolve(msg);
	});
	return pResult;
};

/**
 * Generates a message to inform the user that the entered command is unknown
 * @param  {Array|String} argv    The args of the command, currently unused
 * @param  {Object}       context The context in which to generate the message
 * @return {Promise}              Resolves when the export has finished, with a sendable object
 */
const unknownCmd = (argv, context) => {
	const { cfg } = context;
	const pResult = new Promise(function(resolve, reject) {
		resolve('`I do not know that command! Please use ' + cfg.commandPrefix + 'Help to list available commands.`');
	});
	return pResult;
};

export default {
	help,
	unknownCmd,
};
