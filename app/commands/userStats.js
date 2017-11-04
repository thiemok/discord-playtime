// @flow
import Session from 'models/session';
import generateEmbeds from 'util/embedHelpers';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';
import logging from 'util/log';
import type { CommandContext, CommandResult } from 'commands';
import type { Guild } from 'discord.js';

const logger = logging('playtime:commands:userStats');
/**
 * Generates a report on the given user,
 * containing the total time played and time played for individual games
 * @param   {string[]}        argv    The arguments of the command
 * @param   {CommandContext}  context The context in which to generate the report
 * @return  {CommandResult}           Resolves when the generation has finished, with a sendable object
 */
const userStats = (argv: Array<string>, context: CommandContext): CommandResult => {
	logger.debug('Running cmd userStats with args: %o', argv);
	const { serverID, client } = context;
	const name = argv.join(' ');
	const pResult = new Promise((resolve, reject) => {

		// Get user object
		// $FlowFixMe We recieved a message on serverID so it must exist or something went horribly wrong
		const guild = (client.guilds.get(serverID): Guild);
		const member = guild.members.find('displayName', name);

		if (member != null) {
			// Get user data
			Session.findGameRecordsForPlayer(member.id)
				.then((data) => {
					// Calculate total time played and game time msg
					let totalPlayed: number = 0;
					const timesMsgs: Array<string> = [];
					data.forEach((game) => {
						totalPlayed += game.total;
						timesMsgs.push(buildTimeString(game.total));
					});

					Promise.all(data.map(game => buildRichGameString(game)))
						.then((results) => {
							// Build games message
							let gamesMsg: string = '';
							results.forEach((gameTitle, index) => {
								gamesMsg += `${gameTitle}: ${timesMsgs[index]}\n`;
							});

							// Build general stats
							const generalStatsMsg: string =
								`Played a total of *${data.length}* different games\n`
								+ `Total time played: ${buildTimeString(totalPlayed)}`;

							// Build message embed
							generateEmbeds({
								author: { name },
								thumbnail: member.user.avatarURL,
								color: context.color,
								fields: [
									{ name: 'Overall statistics for this user:', value: generalStatsMsg },
									{ name: 'Game', value: gamesMsg.trim() },
								] })
								.then(content => resolve(content.map(embed => ({ embed }))));
						})
						.catch((err) => {
							resolve([`\`Error: ${err}\``]);
						});
				}).catch((err) => {
					resolve([`\`Error: ${err}\``]);
				});
		} else {
			resolve([`\`I could not find ${name} please use an existing username\``]);
		}
	});
	return pResult;
};

export default userStats;
