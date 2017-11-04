/* eslint-env jest */
import handleCommand from 'commands';
import exportJSON from 'commands/export';
import gameStats from 'commands/gameStats';
import { help, unknownCmd } from 'commands/misc';
import overview from 'commands/overview';
import userStats from 'commands/userStats';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';
import mockClientFactory from '../../../__mocks__/discordjs.client';

jest.mock('../export');
jest.mock('../gameStats');
jest.mock('../misc');
jest.mock('../overview');
jest.mock('../userStats');

exportJSON.mockImplementation(() => Promise.resolve());
gameStats.mockImplementation(() => Promise.resolve());
help.mockImplementation(() => Promise.resolve());
unknownCmd.mockImplementation(() => Promise.resolve());
overview.mockImplementation(() => Promise.resolve());
userStats.mockImplementation(() => Promise.resolve());

const testMessage = {
	guild: {
		id: 0,
		members: {
			get: id => mockGuildMemberFactory(id),
		},
	},
	member: {},
	content: '',
	channel: {
		send: () => {},
	},
};
const testCfg = {
	commandPrefix: '!test',
};
const testClient = mockClientFactory();

beforeEach(() => {
	testMessage.content = testCfg.commandPrefix;
	unknownCmd.mockClear();
});

describe('Command matching', () => {

	test('matches overview', () => {
		testMessage.content += 'Overview';
		handleCommand(testMessage, testClient, testCfg);

		expect(overview).toBeCalled();
	});

	test('matches userStats correctly', () => {
		testMessage.content += 'UserStats testUser';
		handleCommand(testMessage, testClient, testCfg);

		expect(userStats).lastCalledWith(
			['testUser'],
			{
				client: testClient,
				cfg: testCfg,
				color: 0,
				member: testMessage.member,
				serverID: testMessage.guild.id,
			}
		);
	});

	test('matches gameStats correctly', () => {
		testMessage.content += 'GameStats testGame';
		handleCommand(testMessage, testClient, testCfg);

		expect(gameStats).lastCalledWith(
			['testGame'],
			{
				client: testClient,
				cfg: testCfg,
				color: 0,
				member: testMessage.member,
				serverID: testMessage.guild.id,
			}
		);
	});

	test('matches help', () => {
		testMessage.content += 'Help';
		handleCommand(testMessage, testClient, testCfg);

		expect(help).toBeCalled();
	});

	test('matches ExportJSON', () => {
		testMessage.content += 'ExportJSON';
		handleCommand(testMessage, testClient, testCfg);

		expect(exportJSON).toBeCalled();
	});

	test('matches unknownCmd on unknown commands', () => {
		testMessage.content += 'UnknownMockCommand';
		handleCommand(testMessage, testClient, testCfg);

		expect(unknownCmd).toBeCalled();
	});

	test('logs errors from executed commands', () => {
		testMessage.content += 'UnknownMockCommand';
		unknownCmd.mockImplementationOnce(() => Promise.reject('Expected fail'));
		handleCommand(testMessage, testClient, testCfg);

		expect(unknownCmd).toBeCalled();
	});
});
