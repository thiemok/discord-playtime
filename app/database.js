import { MongoClient } from 'mongodb';
import assert from 'assert';
import logging from 'util/log';

const logger = logging('playtime:database');

class DBConnector {
	constructor(_url) {
		this.url = _url;
		MongoClient.connect(this.url, (err, db) => {
			assert.equal(null, err);
			db.close();
		});
	}

	// Writes the given session to the database
	insertSession(session, _callback) {
		this.runOperation((db, callback) => {
			const collection = db.collection('sessions');

			// Prepare data
			const now = Date.now();
			const data = {
				uid: session.member.id,
				game: session.game,
				duration: now - session.startDate.getTime(),
				ended: now,
				servers: session.member.client.guilds.keyArray(),
			};
			collection.insert(data);

			logger.debug('Inserted session: %o', data);

			// Finish task
			callback();
		}, _callback);
	}

	// Fetches data on Games played by the given player
	// Fetched data is sorted by total time played per game
	// Returns promise resolving on completion
	getGamesforPlayer(_id) {
		const pResult = new Promise((resolve, reject) => {
			this.runOperation((db, callback) => {
				logger.debug('Querying games for player %s', _id);
				const collection = db.collection('sessions');

				collection.aggregate([
					{ $match: { uid: _id } },
					{ $group: {
						_id: '$game',
						total: { $sum: '$duration' },
					} },
					{ $sort: { total: -1 } },
				]).toArray((err, docs) => {
					if (err) {
						logger.error('Failed Database Query\n%s', err);
						reject('Error querying database. Please try again later');
					} else if (docs.length === 0) {
						// No data available
						reject('I have never seen that user play, please try again later');
					} else {
						resolve(docs);
					}
					callback();
				});

			});
		});
		return pResult;
	}

	// Fetches data on playtime for the given game
	// Fetched data is sorted by time played
	// Returns promise resolving on completion
	getGame(_server, _game) {
		const pResult = new Promise((resolve, reject) => {
			this.runOperation((db, callback) => {
				logger.debug('Querying game %s', _game);
				const collection = db.collection('sessions');

				// Fetch all sessions for the given game and server
				collection.aggregate([
					{ $match: { game: _game, servers: _server } },
					{ $group: { _id: '$uid', total: { $sum: '$duration' } } },
					{ $sort: { total: -1 } },
				]).toArray((err, docs) => {
					if (err) {
						logger.error('Failed Database Query\n%s', err);
						reject('Error querying database. Please try again later');
					} else if (docs.length === 0) {
						// No data available
						reject('I have never seen anyone play that game, please try again later');
					} else {
						resolve(docs);
					}
					callback();
				});
			});
		});
		return pResult;
	}

	// Finds the 5 players with the most total playtime of the given server
	getTopPlayers(_server) {
		const pResult = new Promise((resolve, reject) => {
			this.runOperation((db, callback) => {
				logger.debug('Querying top players for server %s', _server);
				const collection = db.collection('sessions');

				collection.aggregate([
					{ $match: { servers: _server } },
					{ $group: { _id: '$uid', total: { $sum: '$duration' } } },
					{ $sort: { total: -1 } },
					{ $limit: 5 },
				]).toArray((err, docs) => {
					if (err) {
						logger.error('Failed Database Query\n%s', err);
						reject('Error querying database. Please try again later');
					} else {
						resolve(docs);
					}
					callback();
				});
			});
		});
		return pResult;
	}

	// Finds the 5 Games with the most total playtime for the given server
	getTopGames(_server) {
		const pResult = new Promise((resolve, reject) => {
			this.runOperation((db, callback) => {
				logger.debug('Querying top games for server %s', _server);
				const collection = db.collection('sessions');

				collection.aggregate([
					{ $match: { servers: _server } },
					{ $group: { _id: '$game', total: { $sum: '$duration' } } },
					{ $sort: { total: -1 } },
					{ $limit: 5 },
				]).toArray((err, docs) => {
					if (err) {
						logger.error('Failed Database Query\n%s', err);
						reject('Error querying database. Please try again later');
					} else {
						resolve(docs);
					}
					callback();
				});
			});
		});
		return pResult;
	}

	// Returns sum of totalPlayed of all members of the given server
	getTotalTimePlayed(_server) {
		const pResult = new Promise((resolve, reject) => {
			this.runOperation((db, callback) => {
				logger.debug('Querying total time played for server %s', _server);
				const collection = db.collection('sessions');

				collection.aggregate([
					{ $match: { servers: _server } },
					{ $group: { _id: null, total: { $sum: '$duration' } } },
				]).toArray((err, docs) => {
					if (err) {
						logger.error('Failed Database Query\n%s', err);
						reject('Error querying database. Please try again later');
					} else {
						resolve(docs);
					}
					callback();
				});
			});
		});
		return pResult;
	}

	// Returns all Data for the given server
	getAllDataForServer(_server) {
		const pResult = new Promise((resolve, reject) => {
			this.runOperation((db, callback) => {
				logger.debug('Querying all data for server %s', _server);
				const collection = db.collection('sessions');

				collection.find({ servers: _server }).toArray((err, data) => {
					if (err) {
						logger.error('Failed Database Query\n%s', err);
						reject('Error querying database. Please try again later');
					} else {
						// Strip sensitive ids
						data.forEach((session) => {
							delete session._id;
							delete session.servers;
						});
						resolve(data);
					}
					callback();
				});
			});
		});
		return pResult;
	}

	// Handles db connection
	runOperation(operation, callback) {
		MongoClient.connect(this.url, (err, db) => {
			if (err) {
				logger.error('Failed to Connect to Database\n%s', err);
			}
			operation(db, () => {
				db.close();
				if (callback != null) {
					callback();
				}
			});
		});
	}
}

export default DBConnector;
