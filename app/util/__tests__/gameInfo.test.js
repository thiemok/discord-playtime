/* eslint-env jest */
import gameInfo from '../gameInfo';
import igdb from 'igdb-api-node';

jest.mock('igdb-api-node');

beforeEach(() => {
	igdb.games.mockClear();
});

describe('GameInfo', () => {

	describe('findGameURL', () => {
		test('resolves on successful search with url', (done) => {
			const mockResponse = { body: [{ url: 'https://mockgame.game' }] };
			igdb.games.mockImplementationOnce(search => new Promise((res, rej) => res(mockResponse)));

			gameInfo.findGameURL('mockgame')
			.then((resp) => {
				expect(resp).toEqual('https://mockgame.game');
				expect(igdb.games).lastCalledWith({ search: 'mockgame', fields: 'url' });
				done();
			}).catch((e) => {
				// Fail by default here
				/* eslint-disable no-undef */
				fail('Got error when there should not have been one:\n' + e);
				/* eslint-enable no-undef */
				done();
			});

			test('rejects on igdb error', () => {
				igdb.games.mockImplementationOnce(search => new Promise((res, rej) => rej('Fail')));

				expect(gameInfo.findGameURL('mockgame')).rejects.toBe('Fail');
			});
		});
	});

	describe('findGameCover', () => {
		test('resolves on successful search with url', (done) => {
			const mockResponse = { body: [{ cover: { url: '//mockgame.game' } }] };
			igdb.games.mockImplementationOnce(search => new Promise((res, rej) => res(mockResponse)));

			gameInfo.findGameCover('mockgame')
			.then((resp) => {
				expect(resp).toEqual('https://mockgame.game');
				expect(igdb.games).lastCalledWith({ search: 'mockgame', fields: 'cover' });
				done();
			}).catch((e) => {
				// Fail by default here
				/* eslint-disable no-undef */
				fail('Got error when there should not have been one:\n' + e);
				/* eslint-enable no-undef */
				done();
			});

			test('rejects on igdb error', () => {
				igdb.games.mockImplementationOnce(search => new Promise((res, rej) => rej('Fail')));

				expect(gameInfo.findGameCover('mockgame')).rejects.toBe('Fail');
			});
		});
	});

});
