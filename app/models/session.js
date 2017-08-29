// @flow
import mongoose from 'mongoose';
import logging from 'util/log';

const ERROR_LOG_FORMAT = 'Failed Database Query: %s\n%s';

const logger = logging('playtime:db:sessions');
const Schema = mongoose.Schema;

/**
 * A record on a game, recorded over an arbitrary time frame
 * @property  {string}  _id    The name of the game
 * @property  {number}  total  Time played in the recorded timeframe
 */
export type GameRecord = {
	_id: string,
	total: number,
};


/**
 * A record on a player, recorded over an arbitrary time frame
 * @property  {string}  _id    The name of the player
 * @property  {number}  total  Time played in the recorded timeframe
 */
export type PlayerRecord = {
	_id: string,
	total: number,
};

// /**
//  * A single session
//  * @property  {string}         uid       The user id of the user that played the session
//  * @property  {string}         game      The game which has been played
//  * @property  {number}         duration  The duration of the session
//  * @property  {Date}           ended     The data on wich the session has ended
//  * @property  {Array<string>}  guilds    The guilds the player was on when the session was recorded
//  */
// export type Session = {
// 	uid: string,
// 	game: string,
// 	duration: number,
// 	ended: Date,
// 	guilds: Array<string>,
// };

/**
 * A single session
 * @property  {string}  uid       The user id of the user that played the session
 * @property  {string}  game      The game which has been played
 * @property  {number}  duration  The duration of the session
 * @property  {Date}    ended     The data on wich the session has ended
 */
export type ExportedSession = {
	uid: string,
	game: string,
	duration: number,
	ended: Date,
};

const sessionSchema = new Schema({
	uid: { type: String, index: true },
	game: { type: String, index: true },
	duration: Number,
	ended: Date,
	guilds: { type: [String], index: true },
});

/**
 * Fetches GameRecords for each game played by the player with the given id.
 * Records are sorted by total time played
 * @param  {string}                 id The user id of the player
 * @return {Promise<GameRecord[]>}     GameRecords for each game recorded for the player
 */
sessionSchema.statics.findGameRecordsForPlayer = function(id: string): Promise<GameRecord[]> {
	logger.debug('Querying games for player %s', id);

	const query = this.aggregate(
		[
			{ $match: { uid: id } },
			{ $group: {
				_id: '$game',
				total: { $sum: '$duration' },
			} },
			{ $sort: { total: -1, _id: 1 } },
		])
		.cursor();

	const pResult = new Promise((resolve, reject) => {
		const records = [];
		query.exec()
			.eachAsync(doc => records.push(doc))
			.then(() => {
				resolve(records);
			}).catch((err) => {
				logger.error(ERROR_LOG_FORMAT, 'findGameRecordsForPlayer', err);
				reject(err);
			});
	});
	return pResult;
};

/**
 * Fetches PlayerRecords for each player that has played
 * the game with the given name on the given guild.
 * Records are sorted by total time played
 * @param  {string}                   id     The name of the game to find records for
 * @param  {string}                   guild  The guild to search for
 * @return {Promise<PlayerRecord[]>}         PlayerRecords for each player recorded for the game
 */
sessionSchema.statics.findPlayerRecordsForGame = function(id: string, guild: string): Promise<PlayerRecord[]> {
	logger.debug('Querying players for game %s', id);

	const query = this.aggregate(
		[
			{ $match: { game: id, guilds: guild } },
			{ $group: { _id: '$uid', total: { $sum: '$duration' } } },
			{ $sort: { total: -1, _id: 1 } },
		])
		.cursor();

	const pResult = new Promise((resolve, reject) => {
		const records = [];
		query.exec()
			.eachAsync(doc => records.push(doc))
			.then(() => {
				resolve(records);
			}).catch((err) => {
				logger.error(ERROR_LOG_FORMAT, 'findPlayerRecordsForGame', err);
				reject(err);
			});
	});
	return pResult;
};

/**
 * Fetches PlayerRecords for the 5 players with the most time played on the given guild
 * @param  {string}                   guild The guild to search on
 * @return {Promise<PlayerRecord[]>}        PlayerRecords for the 5 players with the most time played
 */
sessionSchema.statics.findTopPlayersForGuild = function(guild: string): Promise<PlayerRecord[]> {
	logger.debug('Querying top players for server %s', guild);

	const query = this.aggregate(
		[
			{ $match: { guilds: guild } },
			{ $group: { _id: '$uid', total: { $sum: '$duration' } } },
			{ $sort: { total: -1, _id: 1 } },
			{ $limit: 5 },
		])
		.cursor();

	const pResult = new Promise((resolve, reject) => {
		const records = [];
		query.exec()
			.eachAsync(doc => records.push(doc))
			.then(() => {
				resolve(records);
			}).catch((err) => {
				logger.error(ERROR_LOG_FORMAT, 'findTopPlayersForGuild', err);
				reject(err);
			});
	});
	return pResult;
};

/**
 * Fetches GameRecords for the 5 games with the most time played on the given guild
 * @param  {string}                 guild The guild to search on
 * @return {Promise<GameRecord[]>}        GameRecords of the 5 most played games on the given guild
 */
sessionSchema.statics.findTopGamesForGuild = function(guild: string): Promise<GameRecord[]> {
	logger.debug('Querying top games for server %s', guild);

	const query = this.aggregate(
		[
			{ $match: { guilds: guild } },
			{ $group: { _id: '$game', total: { $sum: '$duration' } } },
			{ $sort: { total: -1, _id: 1 } },
			{ $limit: 5 },
		])
		.cursor();

	const pResult = new Promise((resolve, reject) => {
		const records = [];
		query.exec()
			.eachAsync(doc => records.push(doc))
			.then(() => {
				resolve(records);
			}).catch((err) => {
				logger.error(ERROR_LOG_FORMAT, 'findTopGamesForGuild', err);
				reject(err);
			});
	});
	return pResult;
};

/**
 * Fetches the sum of time played of all members of the given guild
 * @param  {string} guild The guild to search on
 * @return {number}       Total time played on the given guild
 */
sessionSchema.statics.findTotalTimeForGuild = function(guild: string): Promise<number> {
	logger.debug('Querying total time played for server %s', guild);

	const query = this.aggregate(
		[
			{ $match: { guilds: guild } },
			{ $group: { _id: null, total: { $sum: '$duration' } } },
		]).cursor();

	const pResult = new Promise((resolve, reject) => {
		query.exec()
			.next()
			.then(doc => resolve((doc) ? doc.total : 0))
			.catch((err) => {
				logger.error(ERROR_LOG_FORMAT, 'findTotalTimeForGuild', err);
				reject(err);
			});
	});
	return pResult;
};

/**
 * Fetches all data on the given guild
 * @param  {string}                      guild The guild to search on
 * @return {Prmoise<ExportedSession[]>}        All sessions recorded for the given guild
 */
sessionSchema.statics.allSessionsForGuild = function(guild: string): Promise<ExportedSession[]> {
	logger.debug('Querying all data for server %s', guild);

	const query = this.find({ guilds: guild });

	const pResult = new Promise((resolve, reject) => {
		const sessions = [];
		query.cursor()
			.eachAsync((doc) => {
				const session = Object.assign({}, doc._doc);
				delete session._id;
				delete session.__v;
				delete session.guilds;
				sessions.push(session);
			}).then(() => {
				resolve(sessions);
			}).catch((err) => {
				logger.error(ERROR_LOG_FORMAT, 'allSessionsForGuild', err);
				reject(err);
			});
	});
	return pResult;
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
