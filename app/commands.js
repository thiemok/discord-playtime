const async = require('async');

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
        
        case prefix + 'UserStats':
            pResponse = userStats(args, _db, serverID, _bot);
            break;
        
        case prefix + 'GameStats':
            pResponse = gameStats(args, _db, serverID, _bot);
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
function overview(_db, _serverID, _bot) {
    let pResult = new Promise((resolve, reject) => {
        async.parallel([
            async.asyncify(() => { return _db.getTopPlayers(_serverID)}),
            async.asyncify(() => { return _db.getTopGames(_serverID)}),
            async.asyncify(() => { return _db.getTotalTimePlayed(_serverID)})
        ],
        (err, results) => {
            if(err) {
                resolve('`' + err + '`');
            } else {
                let topPlayers = results[0];
                let topGames = results[1];
                let totalPlayed = results[2][0].total;
                
                //Build message parts
                let topPlayersMsg = '';
                let guildMembers = _bot.guilds.get(_serverID).members;
                let displayName = '';
                for (let player of topPlayers) {
                    displayName = guildMembers.get(player._id).displayName;
                    topPlayersMsg += displayName + ': ' + buildTimeString(player.total) + '\n';
                }

                let topGamesMsg = '';
                for (let game of topGames) {
                    topGamesMsg += game._id + ': ' + buildTimeString(game.total) + '\n';
                }

                let totalPlayedMsg = buildTimeString(totalPlayed) + '\n';

                //Build the final message
                let msg =  '__**Overview**__\n';
                msg += '\n';
                msg += '**Top Players**\n';
                msg += topPlayersMsg;
                msg += '\n';
                msg += '**Most Popular Games** \n';
                msg += topGamesMsg;
                msg += '\n';
                msg += '**Total time played:** ' + totalPlayedMsg;

                resolve(msg);
            }
        });
    });
    return pResult;
}

//Build stats for user
function userStats(_name, _db, _serverID, _bot) {
	var pResult = new Promise(function(resolve, reject) {
        let msg = '';
        let user;

        //get user object
        let member = _bot.guilds.get(_serverID).members.find('displayName', _name);
        if (member != null) {

            //get user data
            let pUser = _db.getGamesforPlayer(member.id);
            pUser.then(function(data) {

                //Calculate total time played and build games message
                let totalPlayed = 0;
                let gamesMsg = '';
                for (let game of data) {
                    totalPlayed += game.total;
                    gamesMsg += game._id + ': ' + buildTimeString(game.total) + '\n';
                }

        	    //build message
        	    msg += '__**' + _name + '**__\n';
        	    msg += '\n';
        	    msg += '**Total time played:** ' + buildTimeString(totalPlayed) + '\n';
        	    msg += '\n';
        	    msg += '**Games:**\n';
        	    msg += gamesMsg;

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

//Bulds stats for game
function gameStats(_name, _db, _serverID, _bot) {
	let pResult = new Promise(function(resolve, reject) {
        let msg = '';
        let pGame = _db.getGame(_serverID, _name);
        pGame.then(function(data) {
        
            //Calculate total time played and build players message
            let totalPlayed = 0;
            let playersMsg = '';
            let guildMembers = _bot.guilds.get(_serverID).members;
            let displayName = '';
            for (let player of data) {
                totalPlayed += player.total;
                displayName = guildMembers.get(player._id).displayName;
                playersMsg += displayName + ': ' + buildTimeString(player.total) + '\n';
            }

            //build message
            msg += '__**' + _name + '**__\n';
            msg += '\n';
            msg += '**Total time played:** ' + buildTimeString(totalPlayed) + '\n';
        	msg += '\n';
        	msg += '**Players:**\n';
            msg += playersMsg;

        	resolve(msg);

        }).catch(function(err) {
        	resolve('`' + err + '`');
        });
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
                var pSend = _sender.sendFile(
                	Buffer.from(JSON.stringify(_data, null, '\t')),
                	'export.JSON',
                	'Data export finished'
                	);
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
	let pResult = new Promise(function(resolve, reject) {
        let prefix = _cfg.commandPrefix;
        let msg = '__**Help**__\n';
        msg += '\n';
        msg += '**Available commands:**\n';
        msg += prefix + 'Overview: *Displays the 5 top players and games*\n';
        msg += prefix + 'UserStats <username>: *Displays detailed statistics about the given user*\n';
        msg += prefix + 'GameStats <game>: *Displays detailed statistics about the given game*\n';
        msg += prefix + 'ExportJSON: *Exports collected data in JSON format*';

        resolve(msg);
	});
	return pResult;
}

//Report unknown command
function unknownCmd(_cfg) {
	let pResult = new Promise(function(resolve, reject) {
		resolve('`I do not know that command! Please use ' + _cfg.commandPrefix + 'Help to list available commands.`');
	});
	return pResult;
}

function buildTimeString(_duration) {
    let totalMinutes = (_duration / 1000) / 60;
    let dayPart = Math.floor(totalMinutes / (60 * 24));
    let hourPart = Math.floor((totalMinutes / 60) % 24);
    let minutePart = Math.floor(totalMinutes % 60);
    
    let timeString = '*';
    timeString += (dayPart > 0) ? (dayPart + 'd ') : '';
    timeString += (hourPart > 0) ? (hourPart + 'h ') : '';
    timeString += minutePart + 'min*'; 

	return timeString;
}

module.exports = handleCommand;