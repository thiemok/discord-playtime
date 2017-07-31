/* eslint-env jest */
import { exportJSON } from '../export';
import db from '../../database';
import mockClientFactory from '../../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../../__mocks__/discordjs.guildMember';

jest.mock('../../database');

const mockData = {
	test1: 1,
	test2: '2',
	test3: {
		id: 3,
	},
};
db.__setMockData(mockData);
const serverID = 'test';
const members = new Map();
const member = mockGuildMemberFactory(1);
const client = mockClientFactory(members);
const context = {
	db,
	serverID,
	client,
	member,
};
const erroringPromise = Promise.reject('Fail');

beforeEach(() => {
	member.sendFile.mockClear();
});

describe('Command exportJSON', () => {
	test('resolves correctly and sends file', (done) => {
		const expectedResolution = "psst I'm sending you a private message";

		exportJSON([], context)
		.then((res) => {
			expect(res).toBe(expectedResolution);
			expect(member.sendFile).lastCalledWith(
				Buffer.from(JSON.stringify(db.__getMockData(), null, '\t')),
				'export.JSON',
				'Data export finished'
			);
			done();
		}).catch((error) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + error);
			/* eslint-enable no-undef */
			done();
		});
	});

	test('resolves to insufficient permissions message for non administrators and does not send a file', (done) => {
		const expectedResolution = '`You have insufficient permissions, only Admins can export`';
		member.permissions.hasPermission.mockImplementationOnce(() => false);

		exportJSON([], context)
		.then((res) => {
			expect(res).toBe(expectedResolution);
			expect(member.sendFile).not.toBeCalled();
			done();
		}).catch((error) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + error);
			/* eslint-enable no-undef */
			done();
		});
	});

	test('resolves to error msg on sendFile error', () => {
		const expectedResolution = '`Error: Fail`';
		member.sendFile.mockImplementationOnce(() => erroringPromise);

		return expect(exportJSON([], context)).resolves.toBe(expectedResolution);
	});

	test('resolves to error msg on db error', () => {
		const expectedResolution = '`Error: Fail`';
		db.getAllDataForServer.mockImplementationOnce(() => erroringPromise);

		return expect(exportJSON([], context)).resolves.toBe(expectedResolution);
	});
});
