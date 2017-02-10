var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

function DBConnector (_url) {
	this.url = _url;
	MongoClient.connect(this.url, function(err, db) {
        assert.equal(null, err);
        db.close();
	});
}

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