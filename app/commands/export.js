// @flow
import logging from 'util/log';
import Session from 'models/session';
import type { CommandContext, CommandResult } from 'commands';

const logger = logging('playtime:commands:export');
/**
 * Exports all data for the current server as JSON
 * @param  {string[]}        argv    The arguments of the command, not used currently
 * @param  {CommandContext}  context The context in which the export the data
 * @return {CommandResult}           Resolves when the export has finished, with a sendable object
 */
const exportJSON = (argv: Array<string>, context: CommandContext): CommandResult => {
	logger.debug('Running cmd exportJSON for %s: %s', context.member.displayName, context.member.id);
	const { member, serverID } = context;
	const pResult = new Promise((resolve, reject) => {
		// Needs to be admin to export db
		if (member.permissions.has('ADMINISTRATOR')) {
			// Export data
			Session.allSessionsForGuild(serverID)
				.then((data) => {
					// Create buffer from string representation of data and send it
					// $FlowIssue: Needs to be fixed in flow-typed
					return member.send({
						files: [{
							attachment: Buffer.from(JSON.stringify(data, null, '\t')),
							name: 'export.JSON',
						}],
						content: 'Data export finished',
					});
				})
				.then(() => {
					resolve(["psst I'm sending you a private message"]);
				}).catch((err) => {
					logger.error(err);
					resolve([`\`Error: ${err}\``]);
				});
		} else {
			logger.error('Attempted export with insufficent permissions by %s: %s', member.displayName, member.id);
			resolve(['`You have insufficient permissions, only Admins can export`']);
		}
	});
	return pResult;
};

export default exportJSON;
