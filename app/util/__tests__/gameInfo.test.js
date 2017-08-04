/* eslint-env jest */
import gameInfo from '../gameInfo';

const mockIgdb = {
	games: jest.fn(),
};
jest.mock('igdb-api-node', () => {
	return () => mockIgdb;
});

describe('GameInfo', () => {

	test('findGameURL resolves on successful search with url', (done) => {
		const mockResponse = { body: [{ url: 'https://mockgame.game' }] };
		mockIgdb.games.mockImplementationOnce(search => Promise.resolve(mockResponse));

		gameInfo.findGameURL('mockgame')
			.then((resp) => {
				expect(resp).toEqual('https://mockgame.game');
				expect(mockIgdb.games).lastCalledWith({ search: 'mockgame', fields: 'url' });
				done();
			}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
				fail('Got error when there should not have been one:\n' + e);
				/* eslint-enable no-undef */
				done();
			});
	});

	test('findGameURL rejects on igdb error', () => {
		mockIgdb.games.mockImplementationOnce(search => Promise.reject('Fail'));

		expect(gameInfo.findGameURL('mockgame')).rejects.toBe('Fail');
	});

	test('findGameCover resolves on successful search with url', (done) => {
		const mockResponse = { body: [{ cover: { url: '//mockgame.game' } }] };
		mockIgdb.games.mockImplementationOnce(search => Promise.resolve(mockResponse));

		gameInfo.findGameCover('mockgame')
			.then((resp) => {
				expect(resp).toEqual('https://mockgame.game');
				expect(mockIgdb.games).lastCalledWith({ search: 'mockgame', fields: 'cover' });
				done();
			}).catch((e) => {
			// Fail by default here
			/* eslint-disable no-undef */
				fail('Got error when there should not have been one:\n' + e);
				/* eslint-enable no-undef */
				done();
			});
	});

	test('findGameCover rejects on igdb error', () => {
		mockIgdb.games.mockImplementationOnce(search => Promise.reject('Fail'));

		expect(gameInfo.findGameCover('mockgame')).resolves.toBeNull();
	});

});
