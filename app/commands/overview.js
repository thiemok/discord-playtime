import { parallel, asyncify } from 'async';
import { initCustomRichEmbed } from 'util/embedHelpers';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';

/**
 * Generates a overview of total time played, top players and top games
 * for the given context
 * @param   {Array|String}  argv    The arguments of the command, currently unused
 * @param   {Object}        context The context for which to generate the overview
 * @return  {Promise}               Promise resolving when the generation has finished, with a sendable object
 */
const overview = (argv, context) => {
	const { db, serverID, client } = context;
	const pResult = new Promise((resolve, reject) => {
		parallel([
			asyncify(() => db.getTopPlayers(serverID)),
			asyncify(() => db.getTopGames(serverID)),
			asyncify(() => db.getTotalTimePlayed(serverID)),
		],
		(error, results) => {
			if (error) {
				resolve('`' + error + '`');
			} else {
				const topPlayers = results[0];
				const topGames = results[1];
				const totalPlayed = results[2][0].total;

				// Fetch game links
				const gameTasks = [];
				topGames.forEach((game) => {
					gameTasks.push(asyncify(() => buildRichGameString(game)));
				});
				parallel(gameTasks, (err, res) => {
					if (err) {
						resolve('`' + err + '`');
					} else {
						// Build message parts
						const guildMembers = client.guilds.get(serverID).members;
						let playersMsg = '';
						let displayName = '';
						topPlayers.forEach((player) => {
							displayName = guildMembers.get(player._id).displayName;
							playersMsg += displayName + ': ' + buildTimeString(player.total) + '\n';
						});

						let gamesMsg = '';
						res.forEach((gameEntry) => {
							gamesMsg += gameEntry + '\n';
						});

						// Build general stats
						let generalStatsMsg = 'Total time played: ' + buildTimeString(totalPlayed);
						generalStatsMsg += '\n';

						// Build the final embed
						const embed = initCustomRichEmbed(serverID, client);
						embed.setAuthor('Overview');
						embed.setThumbnail(client.guilds.get(serverID).iconURL);
						embed.setTitle('General statistics for this server');
						embed.setDescription(generalStatsMsg);
						embed.addField('Top players', playersMsg);
						embed.addField('Most popular games', gamesMsg);

						resolve({ embed: embed });
					}
				});
			}
		});
	});
	return pResult;
};

export default overview;
