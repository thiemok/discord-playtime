/* eslint-env jest */
import handleCommand from '../index';
import { exportJSON } from '../export';
import gameStats from '../gameStats';
import { help, unknownCmd } from '../misc';
import overview from '../overview';
import userStats from '../userStats';

jest.mock('../export');
jest.mock('../gameStats');
jest.mock('../misc');
jest.mock('../overview');
jest.mock('../userStats');

exportJSON.mockImplementation(() => new Promise((res, rej) => res()));
gameStats.mockImplementation(() => new Promise((res, rej) => res()));
help.mockImplementation(() => new Promise((res, rej) => res()));
unknownCmd.mockImplementation(() => new Promise((res, rej) => res()));
overview.mockImplementation(() => new Promise((res, rej) => res()));
userStats.mockImplementation(() => new Promise((res, rej) => res()));

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
		handleCommand(testMessage, {}, {}, testCfg);

		expect(overview).toBeCalled();
	});

	test('matches userStats correctly', () => {

		testMessage.content += 'UserStats testUser';
		handleCommand(testMessage, {}, {}, testCfg);

		expect(userStats).lastCalledWith(
			['testUser'],
			{
				client: {},
				db: {},
				cfg: testCfg,
				member: testMessage.member,
				serverID: testMessage.guild.id,
			}
		);
	});

	test('matches gameStats correctly', () => {

		testMessage.content += 'GameStats testGame';
		handleCommand(testMessage, {}, {}, testCfg);
		
		expect(gameStats).lastCalledWith(
			['testGame'],
			{
				client: {},
				db: {},
				cfg: testCfg,
				member: testMessage.member,
				serverID: testMessage.guild.id,
			}
		);
	});

	test('matches help', () => {

		testMessage.content += 'Help';
		handleCommand(testMessage, {}, {}, testCfg);

		expect(help).toBeCalled();
	});

	test('matches ExportJSON', () => {

		testMessage.content += 'ExportJSON';
		handleCommand(testMessage, {}, {}, testCfg);

		expect(exportJSON).toBeCalled();
	});

	test('matches unknownCmd on unknown commands', () => {

		testMessage.content += 'UnknownMockCommand';
		handleCommand(testMessage, {}, {}, testCfg);

		expect(unknownCmd).toBeCalled();
	});

	test('logs errors from executed commands', () => {

		testMessage.content += 'UnknownMockCommand';
		unknownCmd.mockImplementationOnce(() => new Promise((res, rej) => rej('Expected fail')));
		handleCommand(testMessage, {}, {}, testCfg);

		expect(unknownCmd).toBeCalled();
	});
});
