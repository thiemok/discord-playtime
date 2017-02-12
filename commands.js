//Handle incomming commands
function handleCommand(_cmd, _bot, _db, _cfg) {
	var pResponse;
	var prefix = _cfg.commandPrefix;
	var serverID = _cmd.guild.id;
    var command = '';
    var args = '';

    //Split command and possible arguments
    var i = _cmd.content.indexOf(' ');
    if (i > 0) {
    	command = _cmd.content.substr(0, i);
    	args = _cmd.content.substr(i + 1);
    } else {
    	command = _cmd.content;
    }

    //Execute command
	switch (command) {
        case prefix + 'Help':
            pResponse = help(_cfg);
            break;

		case prefix + 'Overview':
		    pResponse = overview(_db, serverID, _bot);
		    break;

        case prefix + 'Stats':
            pResponse = userStats(args , _db, serverID, _bot);
            break;

        case prefix + 'ExportJSON':
            pResponse = exportJSON(_cmd.member, serverID, _bot, _db);
            break;

		default:
            pResponse = unknownCmd(_cfg);
	}

	pResponse.then(function(msg) {
        _cmd.channel.sendMessage(msg);
	});
}

//Build overview
function overview(_db, _id, _bot) {
	var pResult = new Promise(function(resolve, reject) {
	    var members = _bot.guilds.get(_id).members;
	    var topPlayers = '';
        var topPlayersFullfilled = false;
        var topGames = '';
        var topGamesFullfilled = false;

	    //Build top players list
	    var pTopPlayers = _db.getTopPlayers(_id);
	    pTopPlayers.then(function(users) {
		    var time = '';
            for (var uid in users) {
                time = buildTimeString(users[uid].totalPlayed);
                topPlayers += members.get(users[uid].id).displayName + ': ' + time + '\n';
            }
            topPlayersFullfilled = true;
	    }).catch(function(err) {
            topPlayers = err + '\n';
            topPlayersFullfilled = true;
	    });

        //Build top games list
        var pTopGames = _db.getTopGames(_id);
        pTopGames.then(function(games) {
        	for (game in games) {
        		topGames += games[game].key + ': ' + buildTimeString(games[game].value) + '\n';
        	}
            topGamesFullfilled = true;
        }).catch(function(err) {
        	topGames = err + '\n';
        	topGamesFullfilled = true;
        });

        //Wait for promises to resolve
        var wait = function() {
    	    if (!topPlayersFullfilled || !topGamesFullfilled) {
                setTimeout(wait, 1000);
    	    } else {
    		    //Build the final message
    		    var msg =  '__**Overview**__\n';
	            msg += '\n';
	            msg += '**Top Players**\n';
	            msg += topPlayers;
	            msg += '\n';
	            msg += '**Most Popular Games** \n';
	            msg += topGames;
	            resolve(msg);
    	    }
        }
        setTimeout(wait, 1000);
    });
	return pResult
}

//Build stats for user
function userStats(_name, _db, _serverID, _bot) {
	var pResult = new Promise(function(resolve, reject) {
        var msg = '';
        var user;

        //get user object
        var member = _bot.guilds.get(_serverID).members.find('displayName', _name);
        if (member != null) {

            //get user data
            var pUser = _db.getPlayer(member.id);
            pUser.then(function(_user) {
        	    user = _user;

        	    //build message
        	    msg += '__**' + _name + '**__\n';
        	    msg += '\n';
        	    msg += '**Total time played:** ' + buildTimeString(user.totalPlayed) + '\n';
        	    msg += '\n';
        	    msg += '**Games:**\n';
        	    for (game in user.games) {
                    var time = buildTimeString(user.games[game].value);
                    msg += user.games[game].key + ': ' + time + '\n';
                }
                resolve(msg);
            }).catch(function(err) {
            	resolve('`' + err + '`');
            });
        } else {
        	resolve('`I could not find ' + _name + ' please use an existing username`');
        }
	});
	return pResult;
}

//Export DB as JSON
function exportJSON(_sender, _server, _bot, _db) {
	var pResult = new Promise(function(resolve, reject) {
        var msg = '';
        //Needs to be admin to export db
        if (_sender.permissions.hasPermission('ADMINISTRATOR')) {
            //Export data
            var pData = _db.getAllDataForServer(_server);
            pData.then(function(_data) {
            	//Create buffer from string representation of data and send it
                var pSend = _sender.sendFile(Buffer.from(JSON.stringify(_data)), 'export.JSON', 'Hii');
                pSend.then(function(_msg) {
                	resolve("psst I'm sending you a private message");
                }).catch(function(err) {
                	resolve('`' + err + '`');
                });
            }).catch(function(err) {
            	resolve('`' + err + '`');
            });
        } else {
        	resolve('`You have insufficient permissions, only Admins can export`');
        }
	});
	return pResult;
}

//Display help
function help(_cfg) {
	var pResult = new Promise(function(resolve, reject) {
        var prefix = _cfg.commandPrefix;
        var msg = '__**Help**__\n';
        msg += '\n';
        msg += '**Available commands:**\n';
        msg += prefix + 'Overview: *Displays the 5 top players and games*\n';
        msg += prefix + 'Stats <username>: *Displays detailed statistics about the given user*\n';
        msg += prefix + 'ExportJSON: *Exports collected data in JSON format*';

        resolve(msg);
	});
	return pResult;
}

//Report unknown command
function unknownCmd(_cfg) {
	var pResult = new Promise(function(resolve, reject) {
		resolve('`I do not know that command! Please use ' + _cfg.commandPrefix + 'Help to list available commands.`');
	});
	return pResult;
}

function buildTimeString(_minutes) {
    var hours = Math.floor(_minutes / 60);
    var minutes = _minutes % 60; 

	return '*' + hours + 'h ' + minutes + 'min*';
}

module.exports = handleCommand;