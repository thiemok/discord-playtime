import Updater from '../updater';
import Session from 'models/session';
import mockClientFactory from '../../__mocks__/discordjs.client';
import mockGuildMemberFactory from '../../__mocks__/discordjs.guildMember';
import MockDate from 'mockdate';

jest.mock('../models/session');

const members = new Map([
	[0, mockGuildMemberFactory(0)],
	[1, mockGuildMemberFactory(1)],
	[2, mockGuildMemberFactory(2)],
	[3, mockGuildMemberFactory(3)],
]);
const client = mockClientFactory(members);

const startTime = 1434319925275;
const timeDifference = 90010;

const updater = new Updater(client);

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
		Session.__setMockData({});
	});

	afterEach(() => {
		MockDate.reset();
		resetMemberState();
	});

	test('creates sessions for already playing members but not idle ones or bots', async () => {
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
			duration: timeDifference,
			ended: new Date(Date.now() + timeDifference),
			uid: member1.id,
			guilds: ['MockGuild'],
		};
		const expectedSession2 = Object.assign({}, expectedSession1, { uid: member3.id });

		updater.start();
		MockDate.set(Date.now() + timeDifference);

		expect.assertions(1);
		await updater.stop();
		expect(Session.__getMockData().sessions).toEqual([expectedSession1, expectedSession2]);
	});

	test('closes session on presence update', async () => {
		const member1 = members.get(1);
		const member3 = members.get(3);
		member1.presence.game = { name: 'MockGame' };
		member3.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			duration: timeDifference,
			ended: new Date(Date.now() + timeDifference),
			uid: member1.id,
			guilds: ['MockGuild'],
		};
		const expectedSession2 = Object.assign({}, expectedSession1, { uid: member3.id });

		updater.start();
		MockDate.set(Date.now() + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: {} });
		const newMember3 = Object.assign({}, member3, { presence: {} });

		updater.presenceUpdated(member1, newMember1);
		updater.presenceUpdated(member3, newMember3);

		expect.assertions(1);
		await updater.stop();
		expect(Session.__getMockData().sessions).toEqual([expectedSession1, expectedSession2]);
	});

	test('closes session and opens new on game change', async () => {
		const member1 = members.get(1);
		const member3 = members.get(3);
		member1.presence.game = { name: 'MockGame' };
		member3.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			duration: timeDifference,
			ended: new Date(Date.now() + timeDifference),
			uid: member1.id,
			guilds: ['MockGuild'],
		};
		const expectedSession2 = Object.assign({}, expectedSession1, { uid: member3.id });

		updater.start();
		MockDate.set(Date.now() + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: { game: { name: 'MockGame2' } } });
		const newMember3 = Object.assign({}, member3, { presence: { game: { name: 'MockGame2' } } });
		const expectedSession3 = {
			game: 'MockGame2',
			duration: timeDifference,
			ended: new Date(Date.now() + timeDifference),
			uid: member1.id,
			guilds: ['MockGuild'],
		};
		const expectedSession4 = Object.assign({}, expectedSession3, { uid: newMember3.id });

		updater.presenceUpdated(member1, newMember1);
		updater.presenceUpdated(member3, newMember3);

		MockDate.set(Date.now() + timeDifference);

		expect.assertions(1);
		await updater.stop();
		expect(Session.__getMockData().sessions).toEqual([
			expectedSession1,
			expectedSession2,
			expectedSession3,
			expectedSession4,
		]);
	});

	test('closes session on member going afk', async () => {
		const member1 = members.get(1);
		member1.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			duration: timeDifference,
			ended: new Date(Date.now() + timeDifference),
			uid: member1.id,
			guilds: ['MockGuild'],
		};

		updater.start();
		MockDate.set(Date.now() + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: { status: 'idle' } });

		updater.presenceUpdated(member1, newMember1);

		expect.assertions(2);
		expect(Session.__getMockData().sessions).toEqual([expectedSession1]);
		await updater.stop();
		expect(Session.__getMockData().sessions).toEqual([expectedSession1]);
	});

	test('closes session on member going offline', async () => {
		const member1 = members.get(1);
		member1.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			duration: timeDifference,
			ended: new Date(Date.now() + timeDifference),
			uid: member1.id,
			guilds: ['MockGuild'],
		};

		updater.start();
		MockDate.set(Date.now() + timeDifference);

		const newMember1 = Object.assign({}, member1, { presence: { status: 'offline' } });

		updater.presenceUpdated(member1, newMember1);

		expect.assertions(2);
		expect(Session.__getMockData().sessions).toEqual([expectedSession1]);
		await updater.stop();
		expect(Session.__getMockData().sessions).toEqual([expectedSession1]);
	});

	test('does not open a new session for updated on already tracked users', async () => {
		const member1 = members.get(1);
		member1.presence.game = { name: 'MockGame' };
		const expectedSession1 = {
			game: 'MockGame',
			duration: timeDifference,
			ended: new Date(Date.now() + timeDifference),
			uid: member1.id,
			guilds: ['MockGuild'],
		};

		updater.start();
		MockDate.set(Date.now() + timeDifference);
		updater.presenceUpdated(member1, member1);

		expect.assertions(1);
		await updater.stop();
		expect(Session.__getMockData().sessions).toEqual([expectedSession1]);
	});
});
