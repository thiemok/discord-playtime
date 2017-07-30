/* eslint-env jest */
import stringHelpers from '../stringHelpers';
import { findGameURL } from '../gameInfo';

jest.mock('../gameInfo');

describe('StringHelpers', () => {
	test('buildTimeString works correctly', () => {
		const expectedTimeString = '*1d 1h 0min*';
		expect(stringHelpers.buildTimeString(90010000)).toBe(expectedTimeString);
	});

	describe('buildRichGameString', () => {
		test('works correctly for game found in db', () => {
			const testGame = { _id: 'TestGame', total: 90010000 };
			const testGameURL = 'https://' + testGame._id + '.game';
			const expectedGameString = '**[' + testGame._id + ']('
			+ testGameURL + ')**: '
			+ stringHelpers.buildTimeString(testGame.total);
			findGameURL.mockImplementationOnce(game => Promise.resolve(testGameURL));

			expect(stringHelpers.buildRichGameString(testGame)).resolves.toBe(expectedGameString);
		});

		test('works correctly for game not found in db', () => {
			const testGame = { _id: 'TestGame', total: 90010000 };
			const expectedGameString = '**' + testGame._id + '**: '
			+ stringHelpers.buildTimeString(testGame.total);
			findGameURL.mockImplementationOnce(game => Promise.reject());

			expect(stringHelpers.buildRichGameString(testGame)).resolves.toBe(expectedGameString);
		});
	});
});
