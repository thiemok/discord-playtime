var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

class DBConnector {
    constructor(_url) {
	    this.url = _url;
	    MongoClient.connect(this.url, (err, db) => {
            assert.equal(null, err);
            db.close();
	    });
    }

    //Writes the given session to the database
    insertSession(session, _callback) {
        this.runOperation( (db, callback) => {
            let collection = db.collection('sessions');

            //prepare data
            let uid = session.member.id;
            let ended = Date.now();
            let duration = ended - session.startDate.getTime();
            let game = session.game;
            let servers = session.member.client.guilds.keyArray();

            collection.insert({uid: uid, game: game, duration: duration, ended: ended, servers: servers});

            //Finish task
            callback();
        }, _callback);
    }

    //Fetches data on Games played by the given player
    //Fetched data is sorted by total time played per game
    //Returns promise resolving on completion
    getGamesforPlayer(_id) {
        let pResult = new Promise((resolve, reject) => {
            this.runOperation((db, callback) => {
                let collection = db.collection('sessions');

                collection.aggregate([
                        { $match: { uid: _id}},
                        { $group: {
                            _id: "$game",
                            total: { $sum: "$duration"},
                        }},
                        { $sort: { total: 1}}
                    ]).toArray((err, docs) => {
                    if (err) {
                        console.log('Failed Database Query');
                        console.log(err);
                        reject('Error querying database. Please try again later');
                    } else if (docs.length == 0) {
                        //No data available
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

    //Fetches data on playtime for the given game
    //Fetched data is sorted by time played
    //Returns promise resolving on completion
    getGame(_server, _game) {
        let pResult = new Promise((resolve, reject) => {
            this.runOperation((db, callback) => {
                let collection = db.collection('sessions');

                //Fetch all sessions for the given game and server
                collection.aggregate([
                    { $match: { game: _game, servers: _server}},
                    { $group: { _id: "$uid", total: { $sum: "$duration"}}},
                    { $sort: { total: 1}}
                ]).toArray((err, docs) => {
                    if (err) {
                        console.log('Failed Database Query');
                        console.log(err);
                        reject('Error querying database. Please try again later');
                    } else if (docs.length == 0) {
                        //No data available
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

    //Finds the 5 players with the most total playtime of the given server
    getTopPlayers(_server) {
        let pResult = new Promise((resolve, reject) => {
            this.runOperation((db, callback) => {
                let collection = db.collection('sessions');

                collection.aggregate([
                    { $match: { servers: _server}},
                    { $group: { _id: "$uid", total: { $sum: "$duration"}}},
                    { $sort: {total: 1}},
                    { $limit: 5}
                ]).toArray((err, docs) => {
                    if (err) {
                        console.log('Failed Database Query');
                        console.log(err);
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

    //Finds the 5 Games with the most total playtime for the given server
    getTopGames(_server) {
        let pResult = new Promise((resolve, reject) => {
            this.runOperation((db, callback) => {
                let collection = db.collection('sessions');

                collection.aggregate([
                    { $match: { servers: _server}},
                    { $group: { _id: "$game", total: { $sum: "$duration"}}},
                    { $sort: {total: 1}},
                    { $limit: 5}
                ]).toArray((err, docs) => {
                    if (err) {
                        console.log('Failed Database Query');
                        console.log(err);
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

    //Returns sum of totalPlayed of all members of the given server
    getTotalTimePlayed(_server) {
        let pResult = new Promise((resolve, reject) => {
            this.runOperation((db, callback) => {
                let collection = db.collection('sessions');

                collection.aggregate([
                    { $match: { servers: _server}},
                    { $group: { _id: null, total: { $sum: "$duration"}}},
                ]).toArray((err, docs) => {
                    if (err) {
                        console.log('Failed Database Query');
                        console.log(err);
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

    //Returns all Data for the given server
    getAllDataForServer(_server) {
        let pResult = new Promise((resolve, reject) => {
            this.runOperation((db, callback) => {
                let collection = db.collection('sessions');

                collection.find({servers: _server}).toArray((err, data) => {
                    if (err) {
                        console.log('Failed Database Query');
                        console.log(err);
                        reject('Error querying database. Please try again later');
                    } else {
                        //Strip sensitive ids
                        for (let session of data) {
                            delete session._id;
                            delete session.servers;
                        }
                        resolve(data);
                    }
                    callback();
                });
            });
        });
        return pResult;
    }

    //Handles db connection
    runOperation(operation, callback) {
        MongoClient.connect(this.url, (err, db) => {
            if (err) {
                console.log('Failed to Connect to Database');
                console.log(err);
            }
            operation(db, () => {
                db.close();
                if(callback != null) {
                    callback();
                }
            });
        });
    }
};

module.exports = DBConnector;