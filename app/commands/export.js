/**
 * Exports all data for the current server as JSON
 * @param  {Array|String} argv    The arguments of the command, not used currently
 * @param  {Object}       context The context in which the export the data
 * @return {Promise}              Resolves when the export has finished, with a sendable object
 */
const exportJSON = (argv, context) => {
	const { member, serverID, db } = context;
	const pResult = new Promise(function(resolve, reject) {
		// Needs to be admin to export db
		if (member.permissions.hasPermission('ADMINISTRATOR')) {
			// Export data
			db.getAllDataForServer(serverID)
			.then((data) => {
				// Create buffer from string representation of data and send it
				member.sendFile(
					Buffer.from(JSON.stringify(data, null, '\t')),
					'export.JSON',
					'Data export finished'
				)
				.then(() => {
					resolve("psst I'm sending you a private message");
				}).catch((err) => {
					resolve('`Error: ' + err + '`');
				});
			}).catch((err) => {
				resolve('`Error: ' + err + '`');
			});
		} else {
			resolve('`You have insufficient permissions, only Admins can export`');
		}
	});
	return pResult;
};

export default {
	exportJSON,
};
