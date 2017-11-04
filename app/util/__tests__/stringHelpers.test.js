/* eslint-env jest */
import * as stringHelpers from '../stringHelpers';
import { findGameURL } from '../gameInfo';

jest.mock('../gameInfo');

describe('StringHelpers', () => {

	test('buildTimeString works correctly with d/h/min', () => {
		const expectedTimeString = '*1d 1h 0min*';
		expect(stringHelpers.buildTimeString(90010000)).toBe(expectedTimeString);
	});

	test('buildTimeString works correctly with h/min', () => {
		const expectedTimeString = '*2h 30min*';
		expect(stringHelpers.buildTimeString(9001000)).toBe(expectedTimeString);
	});

	test('buildTimeString works correctly with min', () => {
		const expectedTimeString = '*15min*';
		expect(stringHelpers.buildTimeString(900100)).toBe(expectedTimeString);
	});

	test('buildRichGameString works correctly for game found in db', () => {
		const testGame = { _id: 'TestGame', total: 90010000 };
		const testGameURL = 'https://' + testGame._id + '.game';
		const expectedGameString = '**[' + testGame._id + ']('
		+ testGameURL + ')**';
		findGameURL.mockImplementationOnce(game => Promise.resolve(testGameURL));

		expect(stringHelpers.buildRichGameString(testGame)).resolves.toBe(expectedGameString);
	});

	test('buildRichGameString works correctly for game not found in db', () => {
		const testGame = { _id: 'TestGame', total: 90010000 };
		const expectedGameString = '**' + testGame._id + '**';
		findGameURL.mockImplementationOnce(game => Promise.reject());

		expect(stringHelpers.buildRichGameString(testGame)).resolves.toBe(expectedGameString);
	});

	test('splitAtLineBreakPoint splits before last [\\n\\r\\u2028\\u2029]', () => {
		const testString = 'Lorem \nipsum\ndolor sit amet';

		expect(stringHelpers.splitAtLineBreakPoint(testString, 15))
			.toEqual(['Lorem \nipsum', 'dolor sit amet']);
	});

	test('splitAtLineBreakPoint splits before last [\\n\\r\\u2028\\u2029] and removes leading whitespace', () => {
		const testString = 'Lorem\n ipsum\n dolor sit amet';

		expect(stringHelpers.splitAtLineBreakPoint(testString, 15))
			.toEqual(['Lorem\n ipsum', 'dolor sit amet']);
	});

	test('splitAtLineBreakPoint splits after last \\s', () => {
		const testString = 'Lorem ipsum dolor sit amet';

		expect(stringHelpers.splitAtLineBreakPoint(testString, 15))
			.toEqual(['Lorem ipsum', 'dolor sit amet']);
	});

	test('splitAtLineBreakPoint splits at desired lineLength', () => {
		const testString = 'Loremipsumdolor sit amet';

		expect(stringHelpers.splitAtLineBreakPoint(testString, 10))
			.toEqual(['Loremipsum', 'dolor sit amet']);
	});
});
