/* eslint-env jest */
import initCustomRichEmbed from '../embedHelpers';
import { RichEmbed } from 'discord.js';
import MockDate from 'mockdate';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';

const serverID = 'test';
const members = new Map([
	[0, mockGuildMemberFactory(0)],
]);
const client = mockClientFactory(members);

beforeAll(() => {
	MockDate.set(1434319925275);
});

afterAll(() => {
	MockDate.reset();
});

describe('EmbedHelpers', () => {
	test('initCustomRichEmbed works correctly', () => {
		const expectedEmbed = new RichEmbed()
			.setColor(members.get(0).highestRole.color)
			.setTimestamp()
			.setFooter(
				'Powered by discord-playtime',
				'https://assets-cdn.github.com/favicon.ico'
			);

		expect(initCustomRichEmbed(serverID, client)).toEqual(expectedEmbed);
	});
});
