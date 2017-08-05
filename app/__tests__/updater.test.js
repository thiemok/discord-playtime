/* eslint-env jest */
import Updater from '../updater';
import db from '../database';
import mockClientFactory from '../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../__mocks__/discordjs.guildMember';
import MockDate from 'mockdate';

jest.mock('../database');

const members = new Map([
	[0, mockGuildMemberFactory(0)],
	[1, mockGuildMemberFactory(1)],
	[2, mockGuildMemberFactory(2)],
	[3, mockGuildMemberFactory(3)],
]);
const client = mockClientFactory(members);

const startTime = 1434319925275;
const timeDifference = 90010;

const updater = new Updater(client, db);

const resetMemberState = () => {
	members.clear();
	members.set(0, mockGuildMemberFactory(0));
	members.set(1, mockGuildMemberFactory(1));
	members.set(2, mockGuildMemberFactory(2));
	members.set(3, mockGuildMemberFactory(3));
};

describe('Updater', () => {

	beforeEach(() => {
		MockDate.set(startTime);
		db.__setMockData({});
	});

	afterEach(() => {
		MockDate.reset();
		resetMemberState();
	});

	test('creates sessions for already playing members but not idle ones or bots', () => {
		const member0 = members.get(0);
		const member1 = members.get(1);
		const member2 = members.get(2);
		const member3 = members.get(3);
		member0.presence.game = { name: 'BotMockGame' };
		member0.user.bot = true;
		member1.presence.game = { name: 'MockGame' };
		member2.presence.game = { name: 'MockGame' };
		member2.presence.status = 'idle';
		member3.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			startDate: new Date(),
			member: member1,
			servers: ['MockServer'],
		};
		const expectedSession2 = Object.assign({}, expectedSession1, { member: member3 });

		updater.start();
		MockDate.set(startTime + timeDifference);

		new Promise((resolve, reject) => {
			updater.stop(resolve);
		}).then(() => {
			expect(db.__getMockData().sessions).toEqual([expectedSession1, expectedSession2]);
		}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + e);
			/* eslint-enable no-undef */
		});
	});

	test('closes session on presence update', () => {
		const member1 = members.get(1);
		const member3 = members.get(3);
		member1.presence.game = { name: 'MockGame' };
		member3.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			startDate: new Date(),
			member: member1,
			servers: ['MockServer'],
		};
		const expectedSession2 = Object.assign({}, expectedSession1, { member: member3 });

		updater.start();
		MockDate.set(startTime + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: {} });
		const newMember3 = Object.assign({}, member3, { presence: {} });

		updater.presenceUpdated(member1, newMember1);
		updater.presenceUpdated(member3, newMember3);

		new Promise((resolve, reject) => {
			updater.stop(resolve);
		}).then(() => {
			expect(db.__getMockData().sessions).toEqual([expectedSession1, expectedSession2]);
		}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + e);
			/* eslint-enable no-undef */
		});
	});

	test('closes session and opens new on game change', () => {
		const member1 = members.get(1);
		const member3 = members.get(3);
		member1.presence.game = { name: 'MockGame' };
		member3.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			startDate: new Date(),
			member: member1,
			servers: ['MockServer'],
		};
		const expectedSession2 = Object.assign({}, expectedSession1, { member: member3 });

		updater.start();
		MockDate.set(startTime + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: { game: { name: 'MockGame2' } } });
		const newMember3 = Object.assign({}, member3, { presence: { game: { name: 'MockGame2' } } });
		const expectedSession3 = {
			game: 'MockGame2',
			startDate: new Date(),
			member: newMember1,
			servers: ['MockServer'],
		};
		const expectedSession4 = Object.assign({}, expectedSession3, { member: newMember3 });

		updater.presenceUpdated(member1, newMember1);
		updater.presenceUpdated(member3, newMember3);

		new Promise((resolve, reject) => {
			updater.stop(resolve);
		}).then(() => {
			expect(db.__getMockData().sessions).toEqual([
				expectedSession1,
				expectedSession2,
				expectedSession3,
				expectedSession4,
			]);
		}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + e);
			/* eslint-enable no-undef */
		});
	});

	test('closes session on member going afk', (done) => {
		const member1 = members.get(1);
		member1.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			startDate: new Date(),
			member: member1,
			servers: ['MockServer'],
		};

		updater.start();
		MockDate.set(startTime + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: { status: 'idle' } });

		updater.presenceUpdated(member1, newMember1);
		expect(db.__getMockData().sessions).toEqual([expectedSession1]);
		new Promise((resolve, reject) => {
			updater.stop(resolve);
		}).then(() => {
			expect.assertions(1);
			done();
		}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + e);
			/* eslint-enable no-undef */
		});
	});

	test('closes session on member going offline', (done) => {
		const member1 = members.get(1);
		member1.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			startDate: new Date(),
			member: member1,
			servers: ['MockServer'],
		};

		updater.start();
		MockDate.set(startTime + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: { status: 'offline' } });

		updater.presenceUpdated(member1, newMember1);
		expect(db.__getMockData().sessions).toEqual([expectedSession1]);
		new Promise((resolve, reject) => {
			updater.stop(resolve);
		}).then(() => {
			expect.assertions(1);
			done();
		}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + e);
			/* eslint-enable no-undef */
		});
	});

	test('does not open a new session for updated on already tracked users', () => {
		const member1 = members.get(1);
		member1.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			startDate: new Date(),
			member: member1,
			servers: ['MockServer'],
		};

		updater.start();
		MockDate.set(startTime + timeDifference);
		updater.presenceUpdated(member1, member1);

		new Promise((resolve, reject) => {
			updater.stop(resolve);
		}).then(() => {
			expect(db.__getMockData().sessions).toEqual([expectedSession1]);
		}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
			fail('Got error when there should not have been one:\n' + e);
			/* eslint-enable no-undef */
		});
	});
});
