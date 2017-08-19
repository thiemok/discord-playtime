// @flow
import { findGameURL } from 'util/gameInfo';
import type { GameRecord } from '../database';

export const buildTimeString = (duration: number): string => {
	const totalMinutes = (duration / 1000) / 60;
	const dayPart = Math.floor(totalMinutes / (60 * 24));
	const hourPart = Math.floor((totalMinutes / 60) % 24);
	const minutePart = Math.floor(totalMinutes % 60);

	let timeString: string = '*';
	timeString += (dayPart > 0) ? (dayPart + 'd ') : '';
	timeString += (hourPart > 0) ? (hourPart + 'h ') : '';
	timeString += minutePart + 'min*';

	return timeString;
};

export const buildRichGameString = (game: GameRecord): Promise<string> => {
	const pTitle = new Promise((resolve, reject) => {
		let entry: string = '';
		let formattedTitle: string = '';

		findGameURL(game._id)
			.then((result) => {
				formattedTitle = `**[${game._id}](${result})**`;
				entry = formattedTitle + ': ' + buildTimeString(game.total);
				resolve(entry);
			}).catch((err) => {
				formattedTitle = '**' + game._id + '**';
				entry = formattedTitle + ': ' + buildTimeString(game.total);
				resolve(entry);
			});
	});
	return pTitle;
};