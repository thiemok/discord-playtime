/* eslint-env jest */
import handleCommand from 'commands';
import exportJSON from 'commands/export';
import gameStats from 'commands/gameStats';
import { help, unknownCmd } from 'commands/misc';
import overview from 'commands/overview';
import userStats from 'commands/userStats';

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

beforeEach(() => {
	testMessage.content = testCfg.commandPrefix;
	unknownCmd.mockClear();
});

describe('Command matching', () => {

	test('matches overview', () => {
		testMessage.content += 'Overview';
		handleCommand(testMessage, {}, testCfg);

		expect(overview).toBeCalled();
	});

	test('matches userStats correctly', () => {
		testMessage.content += 'UserStats testUser';
		handleCommand(testMessage, {}, testCfg);

		expect(userStats).lastCalledWith(
			['testUser'],
			{
				client: {},
				cfg: testCfg,
				member: testMessage.member,
				serverID: testMessage.guild.id,
			}
		);
	});

	test('matches gameStats correctly', () => {
		testMessage.content += 'GameStats testGame';
		handleCommand(testMessage, {}, testCfg);

		expect(gameStats).lastCalledWith(
			['testGame'],
			{
				client: {},
				cfg: testCfg,
				member: testMessage.member,
				serverID: testMessage.guild.id,
			}
		);
	});

	test('matches help', () => {
		testMessage.content += 'Help';
		handleCommand(testMessage, {}, testCfg);

		expect(help).toBeCalled();
	});

	test('matches ExportJSON', () => {
		testMessage.content += 'ExportJSON';
		handleCommand(testMessage, {}, testCfg);

		expect(exportJSON).toBeCalled();
	});

	test('matches unknownCmd on unknown commands', () => {
		testMessage.content += 'UnknownMockCommand';
		handleCommand(testMessage, {}, testCfg);

		expect(unknownCmd).toBeCalled();
	});

	test('logs errors from executed commands', () => {
		testMessage.content += 'UnknownMockCommand';
		unknownCmd.mockImplementationOnce(() => Promise.reject('Expected fail'));
		handleCommand(testMessage, {}, testCfg);

		expect(unknownCmd).toBeCalled();
	});
});
