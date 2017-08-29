// @flow
import initCustomRichEmbed from 'util/embedHelpers';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';
import logging from 'util/log';
import Session from 'models/session';
import type { CommandContext } from 'commands';
import type { StringResolvable, GuildMember, Guild } from 'discord.js';


const logger = logging('playtime:commands:overview');

/**
 * Generates a overview of total time played, top players and top games
 * for the given context
 * @param   {Array|String}  argv    The arguments of the command, currently unused
 * @param   {Object}        context The context for which to generate the overview
 * @return  {Promise}               Promise resolving when the generation has finished, with a sendable object
 */
const overview = (argv: Array<string>, context: CommandContext): Promise<StringResolvable> => {
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
				const gameTasks = topGames.map(game => buildRichGameString(game));
				Promise.all(gameTasks)
					.then((res) => {
						// Build message parts
						const guildMembers = guild.members;
						let playersMsg: string = '';
						let member: ?GuildMember;
						topPlayers.forEach((player) => {
							member = guildMembers.get(player._id);
							if (member != null) {
								playersMsg += `${member.displayName}: ${buildTimeString(player.total)}\n`;
							}
						});

						const gamesMsg = res.join('\n');

						// Build the final embed
						const embed = initCustomRichEmbed(serverID, client);
						embed.setAuthor('Overview');
						embed.setThumbnail(guild.iconURL);
						embed.setTitle('General statistics for this server');
						embed.setDescription(`Total time played: ${buildTimeString(totalPlayed)}`);
						embed.addField('Top players', playersMsg);
						embed.addField('Most popular games', gamesMsg);

						resolve({ embed: embed });
					})
					.catch((err) => {
						resolve(`\`Error: ${err}\``);
					});
			})
			.catch((err) => {
				resolve(`\`Error: ${err}\``);
			});
	});
	return pResult;
};

export default overview;
