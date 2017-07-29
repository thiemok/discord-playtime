/* eslint-env jest */

const mockMessageFactory = jest.fn((msg, memberisAdmin = false) => {
	return {
		guild: {
			id: 1,
		},
		content: msg,
		member: {
			permissions: {
				hasPermission: perm => memberisAdmin,
			},
			sendFile: () => { return new Promise((resolve, reject) => { resolve(); }); },
		},
	};
});

export default mockMessageFactory;
