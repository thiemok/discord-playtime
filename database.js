var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

function DBConnector (_url) {
	this.url = _url;
	MongoClient.connect(this.url, function(err, db) {
        assert.equal(null, err);
        db.close();
	});
}

//Updates data for the user with the given id,
//or inserts a new user of none is found for the given id
DBConnector.prototype.updateUser = function(_id, _game, _servers, _interval) {
    this.runOperation(function(db, callback) {
        var collection = db.collection('users');
        var timeIncrement = _interval / 60;

        collection.find({id: _id}).limit(1).toArray(function(err, user) {
            if (err) {
            	console.log('Failed Database Query');
            	console.log(err);
            }
            //Check for unknown user
            if (user.length == 0) {
            	games = new Object();
            	games[_game] = timeIncrement;
                collection.insert(
                	{id: _id, servers: _servers, games: games, totalPlayed: timeIncrement},
                	function(err, r) {
                		if (err) {
                			console.log('Failed Database Write');
            	            console.log(err);
                		}
                		callback();
                	}
                );
            } else {
            	for (var uid in user) {
            	    games = user[uid]['games'];
            	    total = user[uid]['totalPlayed'] + timeIncrement;
            	    //Check if game hasn't been played
            	    if (games[_game] == null) {
            	    	games[_game] = timeIncrement;
            	    } else {
            	    	games[_game] += timeIncrement; 
            	    }
            	    collection.updateOne(
            	    	{id: _id},
            	    	{$set: {games: games, servers: _servers, totalPlayed: total}},
            	    	function(err, r) {
                    		if (err) {
                    			console.log('Failed Database Write');
            	                console.log(err);
                    		}
                    		callback();
                    	}
                    );
                }
            }
        });
    });
};

//Returns Data on the given player
DBConnector.prototype.getPlayer = function(_id) {
	var self = this;
	var pResult = new Promise(function(resolve, reject) {
        self.runOperation(function(db, callback) {
        	var collection = db.collection('users');

        	collection.find({id: _id}).limit(1).toArray(function(err, users) {
                if (err) {
           	        console.log('Failed Database Query');
           	        console.log(err);
           	        reject('Error querying database. Please try again later');
                }

                if (users.length != 0) {
                    //Data available
                    var user;
                    for (var uid in users) {
                        user = users[uid];
                        //Sort games
                        var sortedGames = new Array();
                        for (game in user.games) {
                        	if (hasOwnProperty.call(user.games, game)) {
                                sortedGames.push({key: game, value: user.games[game]});
                            }
                        }
                        sortedGames.sort(function(a, b) {
                            return b.value - a.value;
                        });
                        user.games = sortedGames;
                    }
                    resolve(user);
                } else {
                	//No data available
                	reject('I have never seen that user play, please try again later');
                }

        		callback();
        	});
        });
	});
	return pResult;
}

DBConnector.prototype.getGame = function(_server, _game) {
	var self = this;
	var pResult = new Promise(function(resolve, reject) {
        self.runOperation(function(db, callback) {
        	var collection = db.collection('users');
            //Find all users on the given server that played that game, extract useful data and sum playtime
        	collection.aggregate([
        		                    { $match: { servers: _server, ['games.' + _game]: {$exists: true}}},
                                    { $group: {
                                    	_id: null,
                                    	total: { $sum: '$games.' + _game},
                                        players: { $push: {id: '$id', time: '$games.' + _game}}}}
        		                ])
        	          .toArray(function(err, docs) {
        		        if (docs.length != 0) {
        		            if (err) {
    		   	            	console.log('Failed Database Query');
           	                    console.log(err);
                                reject('Error querying database. Please try again later');
              	            } else {
              	            	//Sort players
                                docs[0].players.sort(function(a, b) {
                                    return b.time - a.time;
                                });
              	            	resolve(docs[0]);
              	            }
              	        } else {
              	        	//No data available
                	        reject('I have never seen anyone play that game, please try again later');
              	        }

              	        callback();
        	});
        });
	});
	return pResult;
}

//Finds the 5 players with the most total playtime for the given server
DBConnector.prototype.getTopPlayers = function(_server) {
	var self = this;
	var pResult = new Promise(function(resolve, reject) {
	    self.runOperation(function(db, callback){
		    var collection = db.collection('users');
		    var result = new Array();

            collection.find({servers: _server})
                      .sort({totalPlayed: -1})
                      .limit(5)
                      .toArray(function(err, users) {
                if (err) {
           	        console.log('Failed Database Query');
           	        console.log(err);
           	        reject('Error querying database. Please try again later');
                }
                for (var uid in users) {
          	        result.push(users[uid]);
                }
                resolve(result);

                callback();
            });
	    });
    });
    return pResult;
}

//Finds the 5 Games with the most total playtime for the given server
DBConnector.prototype.getTopGames = function(_server) {
	var self = this;
	var pResult = new Promise(function(resolve, reject) {
		self.runOperation(function(db, callback) {
			var collection = db.collection('users');
			var result = new Array();

			//Get all users for the given server
			collection.find({servers: _server}).toArray(function(err, users) {
				var games = new Map();
				if (err) {
           	        console.log('Failed Database Query');
           	        console.log(err);
           	        reject('Error querying database. Please try again later');
                }
                //Collect game entries
                var time;
                for (var uid in users) {
                    for (game in users[uid].games) {
                    	if (hasOwnProperty.call(users[uid].games, game)) {
                    		time = users[uid].games[game];
                    		if (games.has(game)) {
                    			games.set(game, games.get(game) + time);
                    		} else {
                    			games.set(game, time);
                    		}
                    	}
                    }
                }
                //Sort entries
                var sortedGames = new Array();
                for (let [key, value] of games) {
                    sortedGames.push({key, value});
                }
                sortedGames.sort(function(a, b) {
                    return b.value - a.value;
                });

                resolve(sortedGames.slice(0, 5));

                callback();
			});
		});
	});
	return pResult;
}

//Returns sum of totalPlayed of all members of the given server
DBConnector.prototype.getTotalTimePlayed = function(_server) {
    var self = this;
    var pResult = new Promise(function(resolve, reject) {
    	self.runOperation(function(db, callback) {
    		var collection = db.collection('users');
    		var result = 0;

    		collection.aggregate([
    			                    { $match: { servers: _server}},
    			                    { $group: { _id: null, total: { $sum: "$totalPlayed"}}}
    			                ])
    		          .toArray(function(err, docs) {
    		            if (err) {
    		   	        	console.log('Failed Database Query');
           	                console.log(err);
                            reject('Error querying database. Please try again later');
              	        } else {
              	        	for (var doc in docs) {
              	        		result = docs[doc].total;
              	        	}
              	        }
              	        resolve(result);
        
                        callback();
            });
    	});
    });
    return pResult;
}

//Returns all Data for the given server
DBConnector.prototype.getAllDataForServer = function(_server) {
	var self = this;
	var pResult = new Promise(function(resolve, reject) {
        self.runOperation(function(db, callback) {
        	var collection = db.collection('users');

        	collection.find({servers: _server}).toArray(function(err, users) {
        		if (err) {
           	        console.log('Failed Database Query');
           	        console.log(err);
           	        reject('Error querying database. Please try again later');
                }
                //Strip sensitive ids
                for (uid in users) {
                    delete users[uid]._id;
                    delete users[uid].servers;
                }
                resolve(users);

                callback();
        	});
        });
	});
	return pResult;
}

DBConnector.prototype.runOperation = function(operation) {
    MongoClient.connect(this.url, function(err, db) {
        if (err) {
        	console.log('Failed to Connect to Database');
        	console.log(err);
        }
        operation(db, function() {
        	db.close();
        });
    });
};

module.exports = DBConnector;