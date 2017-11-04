/* eslint-env jest */
import userStats from 'commands/userStats';
import Session from 'models/session';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';
import generateEmbeds from 'util/embedHelpers';
import { buildTimeString, buildRichGameString } from 'util/stringHelpers';
import { Collection } from 'discord.js';
import MockDate from 'mockdate';

jest.mock('../../models/session');
jest.mock('../../util/stringHelpers');

const mockGames = [
	{ _id: 'Game1', total: 50 },
	{ _id: 'Game2', total: 30 },
	{ _id: 'Game3', total: 20 },
];
Session.__setMockData({
	gamesForPlayer: mockGames,
});
const serverID = 'test';
const members = new Collection([
	[0, mockGuildMemberFactory(0)],
	[1, mockGuildMemberFactory(1)],
]);
const client = mockClientFactory(members);
const context = {
	serverID,
	client,
	color: 'DEFAULT',
};
const erroringPromise = Promise.reject('Fail');

beforeAll(() => {
	MockDate.set(1434319925275);
});

afterAll(() => {
	MockDate.reset();
});

describe('Command userStats', () => {

	test('is building correctly', async () => {
		const testMember = members.get(1);
		const expectedPayload = (await generateEmbeds({
			author: {
				name: testMember.displayName,
			},
			thumbnail: testMember.user.avatarURL,
			color: members.get(0).highestRole.color,
			fields: [
				{
					name: 'Overall statistics for this user:',
					value: 'Played a total of *' + mockGames.length + '* different games\n'
									+ 'Total time played: ' + buildTimeString(100),
				},
				{
					name: 'Game',
					value: `${buildRichGameString(mockGames[0])}: ${buildTimeString(mockGames[0].total)}\n`
									+ `${buildRichGameString(mockGames[1])}: ${buildTimeString(mockGames[1].total)}\n`
									+ `${buildRichGameString(mockGames[2])}: ${buildTimeString(mockGames[2].total)}`,
				},
			],
		})).map(embed => ({ embed }));

		expect.assertions(1);
		return expect(userStats([members.get(1).displayName], context))
			.resolves
			.toEqual(expectedPayload);
	});

	test('resolves to unknown user error on unknown user', () => {
		const unknownUser = 'Anonymous';
		const unknownUserErrorMsg = '`I could not find ' + unknownUser + ' please use an existing username`';

		expect.assertions(1);
		return expect(userStats([unknownUser], context))
			.resolves
			.toEqual([unknownUserErrorMsg]);
	});

	test('resolves to error message on db error', () => {
		Session.findGameRecordsForPlayer.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(userStats([members.get(1).displayName], context))
			.resolves
			.toEqual(['`Error: Fail`']);
	});

	test('resolves to error message on buildRichGameString error', () => {
		buildRichGameString.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(userStats([members.get(1).displayName], context))
			.resolves
			.toEqual(['`Error: Fail`']);
	});
});
