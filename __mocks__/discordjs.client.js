/* eslint-env jest */

const mockClientFactory = jest.fn((members) => {
	return {
		guilds: {
			get: (id) => {
				return {
					members,
					iconURL: 'https://testurl.com',
				};
			},
		},
		user: {
			id: 0,
		},
	};
});

export default mockClientFactory;
