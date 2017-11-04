/* eslint-env jest */
import gameStats from 'commands/gameStats';
import Session from 'models/session';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';
import generateEmbeds from 'util/embedHelpers';
import { buildTimeString } from 'util/stringHelpers';
import { findGameURL, findGameCover } from 'util/gameInfo';
import MockDate from 'mockdate';

jest.mock('../../models/session');
jest.mock('../../util/stringHelpers');
jest.mock('../../util/gameInfo');

const mockGameName = 'Game1';
const mockPlayers = [
	{ _id: 1, total: 50 },
	{ _id: 2, total: 30 },
	{ _id: 3, total: 20 },
];
Session.__setMockData({
	game: mockPlayers,
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
	color: 'DEFAULT',
};
const erroringPromise = Promise.reject('Fail');

beforeAll(() => {
	MockDate.set(1434319925275);
});

afterAll(() => {
	MockDate.reset();
});

describe('Command gameStats', () => {

	test('is building correctly', async () => {
		const expectedPayload = (await generateEmbeds({
			author: {
				name: mockGameName,
				url: 'https://testurl.com',
			},
			thumbnail: 'https://testurl.com',
			color: members.get(0).highestRole.color,
			fields: [
				{
					name: 'Overall statistics for this game:',
					value: `Played by a total of *${mockPlayers.length}*  users\n`
								+ `Total time played: ${buildTimeString(100)}`,
				},
				{
					name: 'Player',
					value: `${members.get(1).displayName}: ${buildTimeString(mockPlayers[0].total)}\n`
									+ `${members.get(2).displayName}: ${buildTimeString(mockPlayers[1].total)}\n`
									+ `${members.get(3).displayName}: ${buildTimeString(mockPlayers[2].total)}`,
				},
			],
		})).map(embed => ({ embed }));

		expect.assertions(1);
		return expect(gameStats([mockGameName], context))
			.resolves
			.toEqual(expectedPayload);
	});

	test('has default Thumbnail and no GameUrl if on findGameURL or findGameCover error', async () => {
		const expectedPayload = (await generateEmbeds({
			author: {
				name: mockGameName,
			},
			color: members.get(0).highestRole.color,
			fields: [
				{
					name: 'Overall statistics for this game:',
					value: `Played by a total of *${mockPlayers.length}*  users\n`
								+ `Total time played: ${buildTimeString(100)}`,
				},
				{
					name: 'Player',
					value: `${members.get(1).displayName}: ${buildTimeString(mockPlayers[0].total)}\n`
									+ `${members.get(2).displayName}: ${buildTimeString(mockPlayers[1].total)}\n`
									+ `${members.get(3).displayName}: ${buildTimeString(mockPlayers[2].total)}`,
				},
			],
		})).map(embed => ({ embed }));

		findGameURL.mockImplementationOnce(() => erroringPromise);
		findGameCover.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(gameStats([mockGameName], context))
			.resolves
			.toEqual(expectedPayload);
	});

	test('resolves to error message on db error', () => {
		Session.findPlayerRecordsForGame.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(gameStats([members.get(1).displayName], context))
			.resolves
			.toEqual(['`Error: Fail`']);
	});
});
