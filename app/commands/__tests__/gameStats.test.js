/* eslint-env jest */
import gameStats from '../gameStats';
import db from '../../database';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';
import { initCustomRichEmbed } from 'util/embedHelpers';
import { buildTimeString } from 'util/stringHelpers';
import { findGameURL, findGameCover } from 'util/gameInfo';
import MockDate from 'mockdate';

jest.mock('../../database');
jest.mock('../../util/stringHelpers');
jest.mock('../../util/gameInfo');

const mockGameName = 'Game1';
const mockPlayers = [
	{ _id: 1, total: 50 },
	{ _id: 2, total: 30 },
	{ _id: 3, total: 20 },
];
db.__setMockData({
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

describe('Command gameStats', () => {
	test('is building correctly', () => {

		const expectedEmbed = initCustomRichEmbed(serverID, client)
		.setAuthor(mockGameName)
		.setTitle('Overall statistics for this game:')
		.setDescription(
			'Played by a total of *' + mockPlayers.length + '*  users\n'
			+ 'Total time played: ' + buildTimeString(100) + '\n'
		)
		.addField(
			'Players:',
			members.get(1).displayName + ': ' + buildTimeString(mockPlayers[0].total) + '\n'
			+ members.get(2).displayName + ': ' + buildTimeString(mockPlayers[1].total) + '\n'
			+ members.get(3).displayName + ': ' + buildTimeString(mockPlayers[2].total) + '\n',
			true
		)
		.setURL('https://testurl.com')
		.setThumbnail('https://testurl.com');

		return expect(gameStats([mockGameName], context)).resolves.toEqual({ embed: expectedEmbed });
	});

	test('has no Thumbnail and GameUrl if on findGameURL or findGameCover error', () => {

		const expectedEmbed = initCustomRichEmbed(serverID, client)
		.setAuthor(mockGameName)
		.setTitle('Overall statistics for this game:')
		.setDescription(
			'Played by a total of *' + mockPlayers.length + '*  users\n'
			+ 'Total time played: ' + buildTimeString(100) + '\n'
		)
		.addField(
			'Players:',
			members.get(1).displayName + ': ' + buildTimeString(mockPlayers[0].total) + '\n'
			+ members.get(2).displayName + ': ' + buildTimeString(mockPlayers[1].total) + '\n'
			+ members.get(3).displayName + ': ' + buildTimeString(mockPlayers[2].total) + '\n',
			true
		);

		findGameURL.mockImplementationOnce(() => erroringPromise);
		findGameCover.mockImplementationOnce(() => erroringPromise);

		return expect(gameStats([mockGameName], context)).resolves.toEqual({ embed: expectedEmbed });
	});

	test('resolves to error message on db error', () => {

		db.getGame.mockImplementationOnce(() => erroringPromise);

		return expect(gameStats([members.get(1).displayName], context)).resolves.toBe('`Error: Fail`');
	});
});
