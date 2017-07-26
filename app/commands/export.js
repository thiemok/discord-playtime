/**
 * Exports all data for the current server as JSON
 * @param  {Array|String} argv    The arguments of the command, not used currently
 * @param  {Object}       context The context in which the export the data
 * @return {Promise}              Resolves when the export has finished, with a sendable object
 */
const exportJSON = (argv, context) => {
	const { sender, serverID, db } = context;
	const pResult = new Promise(function(resolve, reject) {
		// Needs to be admin to export db
		if (sender.permissions.hasPermission('ADMINISTRATOR')) {
			// Export data
			db.getAllDataForServer(serverID)
			.then(function(_data) {
				// Create buffer from string representation of data and send it
				sender.sendFile(
					Buffer.from(JSON.stringify(_data, null, '\t')),
					'export.JSON',
					'Data export finished'
				)
				.then(function(_msg) {
					resolve("psst I'm sending you a private message");
				}).catch(function(err) {
					resolve('`' + err + '`');
				});
			}).catch(function(err) {
				resolve('`' + err + '`');
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
