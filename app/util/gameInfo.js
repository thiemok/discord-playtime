import igdb from 'igdb-api-node';
import logging from 'util/log';

const logger = logging('playtime:util:gameInfo');
/**
 * Searches igdb for the given game and returns its url
 * @param  {String} game The game to search for
 * @return {Promise}     Promise resolving when the search has finished, and returning the url of the found game
 */
const findGameURL = (game) => {
	logger.debug('Fetching url for %s', game);
	const pURL = new Promise((resolve, reject) => {
		igdb().games({ search: game, fields: 'url' })
			.then((response) => {
				resolve(response.body[0].url);
			}).catch((err) => {
				logger.error(err);
				reject(err);
			});
	});
	return pURL;
};

/**
 * Searches igdb for the given games cover
 * @param  {String} game The game to search for
 * @return {Promise}     Promise resolving when the search has finished, and returning the url of the found games cover
 */
const findGameCover = (game) => {
	logger.debug('Fetching cover for %s', game);
	const pCover = new Promise((resolve, reject) => {
		igdb().games({ search: game, fields: 'cover' })
			.then((response) => {
				resolve('https:' + response.body[0].cover.url);
			}).catch((err) => {
				logger.error(err);
				resolve(null);
			});
	});
	return pCover;
};

export default {
	findGameURL,
	findGameCover,
};
