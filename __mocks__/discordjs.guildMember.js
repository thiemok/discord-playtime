/* eslint-env jest */

const mockGuildMemberFactory = (id) => {
	return {
		displayName: 'mockGuildMember' + id,
		user: {
			avatarURL: 'https://testurl.com',
		},
		highestRole: {
			color: 0,
		},
	};
};

export default mockGuildMemberFactory;
