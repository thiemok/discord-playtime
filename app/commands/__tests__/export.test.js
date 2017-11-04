/* eslint-env jest */
import exportJSON from 'commands/export';
import Session from 'models/session';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';

jest.mock('../../models/session');

const mockData = {
	test1: 1,
	test2: '2',
	test3: {
		id: 3,
	},
};
Session.__setMockData(mockData);
const serverID = 'test';
const members = new Map();
const member = mockGuildMemberFactory(1);
const client = mockClientFactory(members);
const context = {
	serverID,
	client,
	member,
};
const erroringPromise = Promise.reject('Fail');

beforeEach(() => {
	member.send.mockClear();
});

describe('Command exportJSON', () => {

	test('resolves correctly and sends file', async () => {
		const expectedResolution = "psst I'm sending you a private message";

		expect.assertions(2);
		const data = await exportJSON([], context);
		expect(data).toEqual([expectedResolution]);
		expect(member.send).lastCalledWith({
			files: [{
				attachment: Buffer.from(JSON.stringify(Session.__getMockData(), null, '\t')),
				name: 'export.JSON',
			}],
			content: 'Data export finished',
		});
	});

	test('resolves to insufficient permissions message for non administrators and does not send a file', async () => {
		const expectedResolution = '`You have insufficient permissions, only Admins can export`';
		member.permissions.has.mockImplementationOnce(() => false);

		expect.assertions(2);
		const data = await exportJSON([], context);
		expect(data).toEqual([expectedResolution]);
		expect(member.send).not.toBeCalled();
	});

	test('resolves to error msg on sendFile error', () => {
		const expectedResolution = '`Error: Fail`';
		member.send.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(exportJSON([], context))
			.resolves
			.toEqual([expectedResolution]);
	});

	test('resolves to error msg on db error', () => {
		const expectedResolution = '`Error: Fail`';
		Session.allSessionsForGuild.mockImplementationOnce(() => erroringPromise);

		expect.assertions(1);
		return expect(exportJSON([], context))
			.resolves
			.toEqual([expectedResolution]);
	});
});
