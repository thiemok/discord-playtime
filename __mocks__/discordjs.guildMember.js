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
			hasPermission: jest.fn(() => true),
		},
		presence: {
			status: 'online',
		},
		sendFile: jest.fn(() => new Promise((res, rej) => res())),
	};
};

export default mockGuildMemberFactory;
