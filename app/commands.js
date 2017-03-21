const async = require('async');
const RichEmbed = require("discord.js").RichEmbed;
const igdb = require('igdb-api-node');

//Handle incomming commands
function handleCommand(_cmd, _bot, _db, _cfg) {
	let pResponse;
	let prefix = _cfg.commandPrefix;
	let serverID = _cmd.guild.id;
    let command = '';
    let args = '';

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
        _cmd.channel.send(msg);
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

                //Fetch game links
                let gameTasks = new Array();
                for (let game of topGames) {
                    gameTasks.push(async.asyncify(() => { return buildGameEntry(game)}));
                }
                async.parallel(gameTasks, (err, results) => {
                    if (err) {
                        resolve('`' + err + '`');
                    } else {

                        //Build message parts
                        let playersMsg = '';
                        let guildMembers = _bot.guilds.get(_serverID).members;
                        let displayName = '';
                        for (let player of topPlayers) {
                            displayName = guildMembers.get(player._id).displayName;
                            playersMsg += displayName + ': ' + buildTimeString(player.total) + '\n';
                        }

                        let gamesMsg = '';
                        for (let gameEntry of results) {
                            gamesMsg += gameEntry + '\n';
                        }

                        //Build general stats
                        let generalStatsMsg = 'Total time played: ' + buildTimeString(totalPlayed);
                        generalStatsMsg += '\n';
                
                        //Build the final embed
                        let embed = initCustomRichEmbed(_serverID, _bot);
                        embed.setAuthor('Overview');
                        embed.setThumbnail(_bot.guilds.get(_serverID).iconURL);
                        embed.setTitle('General statistics for this server');
                        embed.setDescription(generalStatsMsg);
                        embed.addField('Top players', playersMsg);
                        embed.addField('Most popular games', gamesMsg);
                
                        resolve({ embed: embed});
                    }
                });
            }
        });
    });
    return pResult;
}

//Build stats for user
function userStats(_name, _db, _serverID, _bot) {
	var pResult = new Promise(function(resolve, reject) {

        //get user object
        let member = _bot.guilds.get(_serverID).members.find('displayName', _name);
        if (member != null) {

            //get user data
            let pUser = _db.getGamesforPlayer(member.id);
            pUser.then(function(data) {
                
                let embed = initCustomRichEmbed(_serverID, _bot);

                //Tasks that need to be run before the embed can be build
                let tasks = new Array();

                //Calculate total time played and build game titles
                let totalPlayed = 0;
                for (let game of data) {
                    totalPlayed += game.total;
                    tasks.push(async.asyncify(() => { return buildGameEntry(game)}));
                }

                async.parallel(tasks, (err, results) => {
                    if(err) {
                        resolve('`' + err + '`');
                    } else {

                        //Build games message
                        let gamesMsg = '';
                        for (let gameEntry of results) {
                            gamesMsg += gameEntry + '\n';
                        }
                        
                        //Build general stats
                        let generalStatsMsg = 'Played a total of *' + data.length + '* different games';
                        generalStatsMsg += '\n';
                        generalStatsMsg += 'Total time played: ' + buildTimeString(totalPlayed);
                        generalStatsMsg += '\n';

                        //build message embed
                        embed.setAuthor(_name);
                        embed.setThumbnail(member.user.avatarURL);
                        embed.setTitle('Overall statistics for this user:');
                        embed.setDescription(generalStatsMsg);
                        embed.addField('Games:', gamesMsg, true);

                        resolve({embed: embed});
                    }
                });
            }).catch(function(err) {
            	resolve('`' + err + '`');
            });
        } else {
        	resolve('`I could not find ' + _name + ' please use an existing username`');
        }
	});
	return pResult;
}

//Build stats for game
function gameStats(_name, _db, _serverID, _bot) {
	let pResult = new Promise(function(resolve, reject) {
        let msg = '';
        let pGame = _db.getGame(_serverID, _name);
        pGame.then(function(data) {
        
            let embed = initCustomRichEmbed(_serverID, _bot);

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

            //build general stats
            let generalStatsMsg = 'Played by a total of *' + data.length + '*  users';
            generalStatsMsg += '\n';
            generalStatsMsg += 'Total time played: ' + buildTimeString(totalPlayed);
            generalStatsMsg += '\n';

            //build message embed
            embed.setAuthor(_name);
            embed.setTitle('Overall statistics for this game:');
            embed.setDescription(generalStatsMsg);
            embed.addField('Players:', playersMsg, true);

            //Fetch cover and url
            async.parallel([
                async.asyncify(() => {return findGameURL(_name)}),
                async.asyncify(() => {return findGameCover(_name)})
            ],
            (err, result) => {
                if (err == null) {
                    embed.setURL(result[0]);
                    if (result[1] != null) {
                        embed.setThumbnail(result[1]);
                    }
                }
                resolve({ embed: embed});
            });
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

//Initialises RichEmbed with default options and customizations applied
function initCustomRichEmbed(_serverID, _bot) {
    let embed = new RichEmbed();
    let server = _bot.guilds.get(_serverID);
    let member = server.members.get(_bot.user.id);

    //Set color to highest groups color
    let color = member.highestRole.color;
    embed.setColor(color);

    //Set timestamp
    embed.setTimestamp();

    //Set footer
    embed.setFooter(
        'Powered by discord-playtime',
        'https://assets-cdn.github.com/favicon.ico');

    return embed;
}

//Builds a Markdown string representing the given game title
function buildGameEntry(game) {
    let pTitle = new Promise((resolve, reject) => {
        let entry = '';
        let formattedTitle = '';

        findGameURL(game._id).then((result) => {
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
}

//Searches for the game on igdb an returns a promise to its url
function findGameURL(game) {
    let pURL = new Promise((resolve, reject) => {
        igdb.games({ search: game, fields: 'url'}).then((response) => {
            resolve(response.body[0].url);
        }).catch((err) => {
            reject(err);
        });
    });
    return pURL;
}

//Searches for the games cover on igdb
//Returns the covers url
function findGameCover(game) {
    let pCover = new Promise((resolve, reject) => {
        igdb.games({ search: game, fields: 'cover'}).then((response) => {
            resolve('https:' + response.body[0].cover.url);
        }).catch((err) => {
            console.log(err);
            resolve(null);
        });
    });
    return pCover;
}

//Builds a string representing the given duration accuratly to the minute
//_duration is in miliseconds
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