// @flow
import initCustomRichEmbed from 'util/embedHelpers';
import { buildTimeString } from 'util/stringHelpers';
import { findGameURL, findGameCover } from 'util/gameInfo';
import logging from 'util/log';
import Session from 'models/session';
import type { CommandContext } from 'commands';
import type { StringResolvable, Guild, GuildMember } from 'discord.js';

const logger = logging('playtime:commands:gameStats');

/**
 * Generates a report on the given game,
 * containing total time played and time per user
 * @param  {Array|String} argv    The arguments of the command
 * @param  {Object}       context The context in which to generate the report
 * @return {Promise}              Resolves when the generation has finished, with a sendable object
 */
const gameStats = (argv: Array<string>, context: CommandContext): Promise<StringResolvable> => {
	logger.debug('Running cmd gameStats with args: %o', argv);
	const { serverID, client } = context;
	// $FlowFixMe We recieved a message on serverID so it must exist or something went horribly wrong
	const guild = (client.guilds.get(serverID): Guild);
	const name = argv.join(' ');
	const pResult = new Promise(function(resolve, reject) {
		Session.findPlayerRecordsForGame(name, serverID)
			.then((data) => {
				const embed = initCustomRichEmbed(serverID, client);

				// Calculate total time played and build players message
				const guildMembers = guild.members;
				let totalPlayed: number = 0;
				let playersMsg: string = '';
				let displayName: string = '';
				let member: ?GuildMember;
				data.forEach((player) => {
					member = guildMembers.get(player._id);
					totalPlayed += player.total;
					displayName = (member != null) ? member.displayName : '';
					playersMsg += `${displayName}: ${buildTimeString(player.total)}\n`;
				});

				// Build general stats
				const generalStatsMsg = `Played by a total of *${data.length}*  users\n`
																+ `Total time played: ${buildTimeString(totalPlayed)}`;

				// Build message embed
				embed.setAuthor(name);
				embed.setTitle('Overall statistics for this game:');
				embed.setDescription(generalStatsMsg);
				embed.addField('Players:', playersMsg, true);

				// Fetch cover and url
				Promise.all([
					findGameURL(name),
					findGameCover(name),
				])
					.then((result) => {
						embed.setURL(result[0]);
						if (result[1] != null) {
							embed.setThumbnail(result[1]);
						}
						resolve({ embed: embed });
					})
					.catch((err) => {
						resolve({ embed: embed });
					});
			}).catch((err) => {
				resolve('`Error: ' + err + '`');
			});
	});
	return pResult;
};

export default gameStats;
