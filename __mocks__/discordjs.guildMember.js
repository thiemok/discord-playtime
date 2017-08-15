/* eslint-env jest */

const mockGuildMemberFactory = (id) => {
	return {
		id,
		displayName: 'mockGuildMember' + id,
		user: {
			avatarURL: 'https://testurl.com',
			bot: false,
		},
		highestRole: {
			color: 0,
		},
		permissions: {
			has: jest.fn(() => true),
		},
		presence: {
			status: 'online',
		},
		send: jest.fn(() => new Promise((res, rej) => res())),
	};
};

export default mockGuildMemberFactory;
