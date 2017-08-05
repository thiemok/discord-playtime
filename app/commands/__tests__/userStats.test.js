/* eslint-env jest */
import userStats from '../userStats';
import db from '../../database';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';
import { initCustomRichEmbed } from 'util/embedHelpers';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';
import { Collection } from 'discord.js';
import MockDate from 'mockdate';

jest.mock('../../database');
jest.mock('../../util/stringHelpers');

const mockGames = [
	{ _id: 'Game1', total: 50 },
	{ _id: 'Game2', total: 30 },
	{ _id: 'Game3', total: 20 },
];
db.__setMockData({
	gamesForPlayer: mockGames,
});
const serverID = 'test';
const members = new Collection([
	[0, mockGuildMemberFactory(0)],
	[1, mockGuildMemberFactory(1)],
]);
const client = mockClientFactory(members);
const context = {
	db,
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

describe('Command userStats', () => {
	test('is building correctly', () => {

		const testMember = members.get(1);
		const expectedEmbed = initCustomRichEmbed(serverID, client)
			.setAuthor(testMember.displayName)
			.setThumbnail(testMember.user.avatarURL)
			.setTitle('Overall statistics for this user:')
			.setDescription(
				'Played a total of *' + mockGames.length + '* different games\n'
			+ 'Total time played: ' + buildTimeString(100) + '\n'
			)
			.addField(
				'Games:',
				buildRichGameString(mockGames[0]) + '\n'
			+ buildRichGameString(mockGames[1]) + '\n'
			+ buildRichGameString(mockGames[2]) + '\n',
				true
			);

		return expect(userStats([members.get(1).displayName], context)).resolves.toEqual({ embed: expectedEmbed });
	});

	test('resolves to unknown user error on unknown user', () => {
		const unknownUser = 'Anonymous';
		const unknownUserErrorMsg = '`I could not find ' + unknownUser + ' please use an existing username`';

		return expect(userStats([unknownUser], context)).resolves.toBe(unknownUserErrorMsg);
	});

	test('resolves to error message on db error', () => {

		db.getGamesforPlayer.mockImplementationOnce(() => erroringPromise);

		return expect(userStats([members.get(1).displayName], context)).resolves.toBe('`Error: Fail`');
	});

	test('resolves to error message on buildRichGameString error', () => {

		buildRichGameString.mockImplementationOnce(() => erroringPromise);

		return expect(userStats([members.get(1).displayName], context)).resolves.toBe('`Error: Fail`');
	});
});
