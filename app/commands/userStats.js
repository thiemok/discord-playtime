import { asyncify, parallel } from 'async';
import { initCustomRichEmbed } from 'util/embedHelpers';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';
import logging from 'util/log';

const logger = logging('playtime:commands:userStats');
/**
 * Generates a report on the given user,
 * containing the total time played and time played for individual games
 * @param   {Array|Sting} argv    The arguments of the command
 * @param   {Object}      context The context in which to generate the report
 * @return  {Promise}             Resolves when the generation has finished, with a sendable object
 */
const userStats = (argv, context) => {
	logger.debug('Running cmd userStats with args: %o', argv);
	const { db, serverID, client } = context;
	const name = argv.join(' ');
	const pResult = new Promise(function(resolve, reject) {

		// Get user object
		const member = client.guilds.get(serverID).members.find('displayName', name);
		if (member != null) {

			// Get user data
			const pUser = db.getGamesforPlayer(member.id);
			pUser.then((data) => {

				const embed = initCustomRichEmbed(serverID, client);

				// Tasks that need to be run before the embed can be build
				const tasks = [];

				// Calculate total time played and build game titles
				let totalPlayed = 0;
				data.forEach((game) => {
					totalPlayed += game.total;
					tasks.push(asyncify(() => buildRichGameString(game)));
				});

				parallel(tasks, (err, results) => {
					if (err) {
						resolve('`' + err + '`');
					} else {
						// Build games message
						let gamesMsg = '';
						results.forEach((gameEntry) => {
							gamesMsg += gameEntry + '\n';
						});

						// Build general stats
						let generalStatsMsg = 'Played a total of *' + data.length + '* different games';
						generalStatsMsg += '\n';
						generalStatsMsg += 'Total time played: ' + buildTimeString(totalPlayed);
						generalStatsMsg += '\n';

						// Build message embed
						embed.setAuthor(name);
						embed.setThumbnail(member.user.avatarURL);
						embed.setTitle('Overall statistics for this user:');
						embed.setDescription(generalStatsMsg);
						embed.addField('Games:', gamesMsg, true);

						resolve({ embed: embed });
					}
				});
			}).catch((err) => {
				resolve('`Error: ' + err + '`');
			});
		} else {
			resolve('`I could not find ' + name + ' please use an existing username`');
		}
	});
	return pResult;
};

export default userStats;
