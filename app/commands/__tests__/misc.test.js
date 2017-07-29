/* eslint-env jest */
import { help, unknownCmd } from '../misc';

const testContext = {
	cfg: {
		commandPrefix: '!test',
	},
};

/**
 * Tests handling of the help command
 */
test('The help command resolves correctly', () => {
	const expectedMessage = '__**Help**__\n'
		+ '\n'
		+ '**Available commands:**\n'
		+ '!testOverview: *Displays the 5 top players and games*\n'
		+ '!testUserStats <username>: *Displays detailed statistics about the given user*\n'
		+ '!testGameStats <game>: *Displays detailed statistics about the given game*\n'
		+ '!testExportJSON: *Exports collected data in JSON format*';
	return expect(help([], testContext)).resolves.toBe(expectedMessage);
});

/**
 * Tests handling of unknown commands
 */
test('The unknown command resolves correctly', () => {
	const expectedMessage = '`I do not know that command! Please use !testHelp to list available commands.`';
	return expect(unknownCmd([], testContext)).resolves.toBe(expectedMessage);
});
