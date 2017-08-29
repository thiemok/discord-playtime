/* eslint-env jest */
import overview from 'commands/overview';
import Session from 'models/session';
import initCustomRichEmbed from 'util/embedHelpers';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';
import MockDate from 'mockdate';

jest.mock('../../models/session');
jest.mock('../../util/stringHelpers');

const mockTopGames = [{ _id: 'Game1' }, { _id: 'Game2' }];
Session.__setMockData({
	topPlayers: [
		{ _id: 1, total: 5 },
		{ _id: 2, total: 25 },
		{ _id: 3, total: 20 },
	],
	topGames: mockTopGames,
	totalTimeplayed: [{ total: 9001 }],
});
const serverID = 'test';
const members = new Map([
	[0, mockGuildMemberFactory(0)],
	[1, mockGuildMemberFactory(1)],
	[2, mockGuildMemberFactory(2)],
	[3, mockGuildMemberFactory(3)],
]);
const client = mockClientFactory(members);
const context = {
	serverID,
	client,
};
const erroringPromise = Promise.reject('Fail');

beforeAll(() => {
	MockDate.set(1434319925275);
});

afterAll(() => {
	MockDate.reset();
});

describe('Command overview', () => {

	test('is building correctly', () => {
		const expectedEmbed = initCustomRichEmbed(serverID, client)
			.setAuthor('Overview')
			.setThumbnail(client.guilds.get('test').iconURL)
			.setTitle('General statistics for this server')
			.setDescription(`Total time played: ${buildTimeString(9001)}`)
			.addField(
				'Top players',
				`${members.get(1).displayName}: ${buildTimeString(5)}\n`
			+ `${members.get(2).displayName}: ${buildTimeString(25)}\n`
			+ `${members.get(3).displayName}: ${buildTimeString(20)}\n`
			)
			.addField(
				'Most popular games',
				buildRichGameString(mockTopGames[0])
				+ '\n'
			+ buildRichGameString(mockTopGames[1])
			);

		expect.assertions(1);
		return expect(overview([], context)).resolves.toEqual({ embed: expectedEmbed });
	});

	test('resolves to error message on db error', () => {
		Session.findTopGamesForGuild.mockImplementationOnce(() => erroringPromise);
		Session.findTopPlayersForGuild.mockImplementationOnce(() => erroringPromise);
		Session.findTotalTimeForGuild.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(overview([], context)).resolves.toBe('`Error: Fail`');
	});

	test('resolves to error message on buildRichGameString error', () => {
		buildRichGameString.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(overview([], context)).resolves.toBe('`Error: Fail`');
	});
});
