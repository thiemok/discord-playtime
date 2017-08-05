// @flow
import { asyncify, parallel } from 'async';
import initCustomRichEmbed from 'util/embedHelpers';
import { buildTimeString } from 'util/stringHelpers';
import { findGameURL, findGameCover } from 'util/gameInfo';
import logging from 'util/log';
import type { CommandContext } from 'commands';
import type { StringResolvable } from 'discord.js';

const logger = logging('playtime:commands:gameStats');

/**
 * Generates a report on the given game,
 * containing total time played and time per user
 * @param  {Array|String} argv    The arguments of the command
 * @param  {Object}       context The context in which to generate the report
 * @return {Promise}              Resolves when the generation has finished, with a sendable object
 */
const gameStats = (argv: Array<string>, context: CommandContext): StringResolvable => {
	logger.debug('Running cmd gameStats with args: %o', argv);
	const { db, serverID, client } = context;
	const name = argv.join(' ');
	const pResult = new Promise(function(resolve, reject) {
		db.getGame(serverID, name)
			.then((data) => {

				const embed = initCustomRichEmbed(serverID, client);

				// Calculate total time played and build players message
				const guildMembers = client.guilds.get(serverID).members;
				let totalPlayed = 0;
				let playersMsg = '';
				let displayName = '';
				data.forEach((player) => {
					totalPlayed += player.total;
					displayName = guildMembers.get(player._id).displayName;
					playersMsg += displayName + ': ' + buildTimeString(player.total) + '\n';
				});

				// Build general stats
				let generalStatsMsg = 'Played by a total of *' + data.length + '*  users';
				generalStatsMsg += '\n';
				generalStatsMsg += 'Total time played: ' + buildTimeString(totalPlayed);
				generalStatsMsg += '\n';

				// Build message embed
				embed.setAuthor(name);
				embed.setTitle('Overall statistics for this game:');
				embed.setDescription(generalStatsMsg);
				embed.addField('Players:', playersMsg, true);

				// Fetch cover and url
				parallel([
					asyncify(() => findGameURL(name)),
					asyncify(() => findGameCover(name)),
				],
				(err, result) => {
					if (err == null) {
						embed.setURL(result[0]);
						if (result[1] != null) {
							embed.setThumbnail(result[1]);
						}
					}
					resolve({ embed: embed });
				});
			}).catch((err) => {
				resolve('`Error: ' + err + '`');
			});
	});
	return pResult;
};

export default gameStats;
