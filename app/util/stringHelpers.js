import { findGameURL } from './gameInfo';

const buildTimeString = (duration) => {
	const totalMinutes = (duration / 1000) / 60;
	const dayPart = Math.floor(totalMinutes / (60 * 24));
	const hourPart = Math.floor((totalMinutes / 60) % 24);
	const minutePart = Math.floor(totalMinutes % 60);

	let timeString = '*';
	timeString += (dayPart > 0) ? (dayPart + 'd ') : '';
	timeString += (hourPart > 0) ? (hourPart + 'h ') : '';
	timeString += minutePart + 'min*';

	return timeString;
};

const buildRichGameString = (game) => {
	const pTitle = new Promise((resolve, reject) => {
		let entry = '';
		let formattedTitle = '';

		findGameURL(game._id)
		.then((result) => {
			formattedTitle = `**[${game._id}](${result})**`;
			entry = formattedTitle + ': ' + buildTimeString(game.total);
			resolve(entry);
		}).catch((err) => {
			console.log(err);
			formattedTitle = '**' + game._id + '**';
			entry = formattedTitle + ': ' + buildTimeString(game.total);
			resolve(entry);
		});
	});
	return pTitle;
};

export default {
	buildRichGameString,
	buildTimeString,
};
