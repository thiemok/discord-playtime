// @flow
import generateEmbeds from 'util/embedHelpers';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';
import logging from 'util/log';
import Session from 'models/session';
import type { CommandContext, CommandResult } from 'commands';
import type { GuildMember, Guild } from 'discord.js';


const logger = logging('playtime:commands:overview');

/**
 * Generates a overview of total time played, top players and top games
 * for the given context
 * @param   {string[]}        argv    The arguments of the command, currently unused
 * @param   {CommandContext}  context The context for which to generate the overview
 * @return  {CommandResult}           Promise resolving when the generation has finished, with a sendable object
 */
const overview = (argv: Array<string>, context: CommandContext): CommandResult => {
	logger.debug('Running cmd overview with args: %o', argv);
	const { serverID, client } = context;
	// $FlowFixMe We recieved a message on serverID so it must exist or something went horribly wrong
	const guild = (client.guilds.get(serverID): Guild);
	const pResult = new Promise((resolve, reject) => {
		Promise.all([
			Session.findTopPlayersForGuild(serverID),
			Session.findTopGamesForGuild(serverID),
			Session.findTotalTimeForGuild(serverID),
		])
			.then((results) => {
				const topPlayers = results[0];
				const topGames = results[1];
				let totalPlayed: number = 0;
				if (results[2][0]) {
					totalPlayed = results[2][0].total;
				}

				// Fetch game links
				Promise.all(topGames.map(game => buildRichGameString(game)))
					.then((gameTitles) => {
						// Build message parts
						const guildMembers = guild.members;
						let playersMsg: string = '';
						let member: ?GuildMember;

						topPlayers.forEach((player) => {
							member = guildMembers.get(player._id);
							const displayName: string = member ? member.displayName : 'unknown';
							playersMsg += `${displayName}: ${buildTimeString(player.total)}\n`;
						});

						let gamesMsg: string = '';
						gameTitles.forEach((title, index) => {
							gamesMsg += `${title._id}: ${buildTimeString(topGames[index].total)}\n`;
						});

						// Build the final embed
						generateEmbeds({
							author: {
								name: 'Overview',
							},
							thumbnail: guild.iconURL,
							color: context.color,
							fields: [
								{
									name: 'General statistics for this server',
									value: `Total time played: ${buildTimeString(totalPlayed)}`,
								},
								{ name: 'Top Players', value: playersMsg.trim() },
								{ name: 'Most popular games', value: gamesMsg.trim() },
							],
						})
							.then(content => resolve(content.map(embed => ({ embed }))));
					})
					.catch((err) => {
						resolve([`\`Error: ${err}\``]);
					});
			})
			.catch((err) => {
				resolve([`\`Error: ${err}\``]);
			});
	});
	return pResult;
};

export default overview;
