// @flow
import generateEmbeds from 'util/embedHelpers';
import { buildTimeString } from 'util/stringHelpers';
import { findGameURL, findGameCover } from 'util/gameInfo';
import logging from 'util/log';
import Session from 'models/session';
import type { CommandContext, CommandResult } from 'commands';
import type { Guild, GuildMember } from 'discord.js';

const logger = logging('playtime:commands:gameStats');

/**
 * Generates a report on the given game,
 * containing total time played and time per user
 * @param  {string[]}        argv    The arguments of the command
 * @param  {CommandContext}  context The context in which to generate the report
 * @return {CommandResult}           Resolves when the generation has finished, with a sendable object
 */
const gameStats = (argv: Array<string>, context: CommandContext): CommandResult => {
	logger.debug('Running cmd gameStats with args: %o', argv);
	const { serverID, client } = context;
	// $FlowFixMe We recieved a message on serverID so it must exist or something went horribly wrong
	const guild = (client.guilds.get(serverID): Guild);
	const name = argv.join(' ');
	const pResult = new Promise(function(resolve, reject) {
		Session.findPlayerRecordsForGame(name, serverID)
			.then((data) => {
				// Calculate total time played and build players message
				const guildMembers = guild.members;
				let totalPlayed: number = 0;
				let playersMsg: string = '';
				let displayName: string = '';
				let member: ?GuildMember;

				data.forEach((player) => {
					member = guildMembers.get(player._id);
					totalPlayed += player.total;
					displayName = (member != null) ? member.displayName : 'unknown';
					playersMsg += `${displayName}: ${buildTimeString(player.total)}\n`;
				});

				// Build general stats
				const generalStatsMsg = `Played by a total of *${data.length}*  users\n`
																+ `Total time played: ${buildTimeString(totalPlayed)}`;

				// Build message embed
				const content = {
					author: { name, url: undefined },
					thumbnail: undefined,
					color: context.color,
					fields: [
						{
							name: 'Overall statistics for this game:',
							value: generalStatsMsg,
						},
						{ name: 'Player', value: playersMsg.trim() },
					],
				};

				// Fetch cover and url
				Promise.all([
					findGameURL(name),
					findGameCover(name),
				])
					.then((result) => {
						content.author.url = result[0];
						content.thumbnail = result[1] ? result[1] : undefined;
						generateEmbeds(content)
							.then(embeds => resolve(embeds.map(embed => ({ embed }))));
					})
					.catch((err) => {
						generateEmbeds(content)
							.then(embeds => resolve(embeds.map(embed => ({ embed }))));
					});
			}).catch((err) => {
				resolve(['`Error: ' + err + '`']);
			});
	});
	return pResult;
};

export default gameStats;
