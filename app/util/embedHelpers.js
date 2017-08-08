// @flow
import { RichEmbed, type Client } from 'discord.js';

/**
 * Initializes a new RichEmbed with default customizations applied
 * @param  {String} serverID The id of the server for which the embed is generated
 * @param  {Object} client   The client for which the embed is generated
 * @return {Object}          RichEmbed with defauld customizations applied
 */
const initCustomRichEmbed = (serverID: string, client: Client): RichEmbed => {
	const embed = new RichEmbed();
	const server = client.guilds.get(serverID);
	if (server != null) {
		const member = server.members.get(client.user.id);
		if (member != null) {

			// Set color to highest groups color
			const color = member.highestRole.color;
			embed.setColor(color);
		}
	}

	// Set timestamp
	embed.setTimestamp();

	// Set footer
	embed.setFooter(
		'Powered by discord-playtime',
		'https://assets-cdn.github.com/favicon.ico'
	);

	return embed;
};

export default initCustomRichEmbed;
