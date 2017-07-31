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
			forEach: (callback) => {
				callback({
					members,
					available: true,
				}, 'MockServer');
			},
		},
		on: jest.fn(() => {}),
		removeListener: jest.fn(() => {}),
		user: {
			id: 0,
		},
	};
});

export default mockClientFactory;
