import async from 'async';
import { RichEmbed } from 'discord.js';
import igdb from 'igdb-api-node';

// Handle incomming commands
function handleCommand(_cmd, _bot, _db, _cfg) {
	const prefix = _cfg.commandPrefix;
	const serverID = _cmd.guild.id;

	let pResponse;
	let command = '';
	let args = '';

	// Split command and possible arguments
	const i = _cmd.content.indexOf(' ');
	if (i > 0) {
		command = _cmd.content.substr(0, i);
		args = _cmd.content.substr(i + 1);
	} else {
		command = _cmd.content;
	}

	// Execute command
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

	pResponse.then((msg) => {
		_cmd.channel.send(msg);
	});
}

// Build overview
function overview(_db, _serverID, _bot) {
	const pResult = new Promise((resolve, reject) => {
		async.parallel([
			async.asyncify(() => _db.getTopPlayers(_serverID)),
			async.asyncify(() => _db.getTopGames(_serverID)),
			async.asyncify(() => _db.getTotalTimePlayed(_serverID)),
		],
		(error, results) => {
			if (error) {
				resolve('`' + error + '`');
			} else {
				const topPlayers = results[0];
				const topGames = results[1];
				const totalPlayed = results[2][0].total;

				// Fetch game links
				const gameTasks = [];
				topGames.forEach((game) => {
					gameTasks.push(async.asyncify(() => buildGameEntry(game)));
				});
				async.parallel(gameTasks, (err, res) => {
					if (err) {
						resolve('`' + err + '`');
					} else {
						// Build message parts
						const guildMembers = _bot.guilds.get(_serverID).members;
						let playersMsg = '';
						let displayName = '';
						topPlayers.forEach((player) => {
							displayName = guildMembers.get(player._id).displayName;
							playersMsg += displayName + ': ' + buildTimeString(player.total) + '\n';
						});

						let gamesMsg = '';
						res.forEach((gameEntry) => {
							gamesMsg += gameEntry + '\n';
						});

						// Build general stats
						let generalStatsMsg = 'Total time played: ' + buildTimeString(totalPlayed);
						generalStatsMsg += '\n';

						// Build the final embed
						const embed = initCustomRichEmbed(_serverID, _bot);
						embed.setAuthor('Overview');
						embed.setThumbnail(_bot.guilds.get(_serverID).iconURL);
						embed.setTitle('General statistics for this server');
						embed.setDescription(generalStatsMsg);
						embed.addField('Top players', playersMsg);
						embed.addField('Most popular games', gamesMsg);

						resolve({ embed: embed });
					}
				});
			}
		});
	});
	return pResult;
}

// Build stats for user
function userStats(_name, _db, _serverID, _bot) {
	const pResult = new Promise(function(resolve, reject) {

		// Get user object
		const member = _bot.guilds.get(_serverID).members.find('displayName', _name);
		if (member != null) {

			// Get user data
			const pUser = _db.getGamesforPlayer(member.id);
			pUser.then(function(data) {

				const embed = initCustomRichEmbed(_serverID, _bot);

				// Tasks that need to be run before the embed can be build
				const tasks = [];

				// Calculate total time played and build game titles
				let totalPlayed = 0;
				data.forEach((game) => {
					totalPlayed += game.total;
					tasks.push(async.asyncify(() => buildGameEntry(game)));
				});

				async.parallel(tasks, (err, results) => {
					if (err) {
						resolve('`' + err + '`');
					} else {
						// Build games message
						let gamesMsg = '';
						results.forEach((gameEntry) => {
							gamesMsg += gameEntry + '\n';
						});

						// Build general stats
						let generalStatsMsg = 'Played a total of *' + data.length + '* different games';
						generalStatsMsg += '\n';
						generalStatsMsg += 'Total time played: ' + buildTimeString(totalPlayed);
						generalStatsMsg += '\n';

						// Build message embed
						embed.setAuthor(_name);
						embed.setThumbnail(member.user.avatarURL);
						embed.setTitle('Overall statistics for this user:');
						embed.setDescription(generalStatsMsg);
						embed.addField('Games:', gamesMsg, true);

						resolve({ embed: embed });
					}
				});
			}).catch((err) => {
				resolve('`' + err + '`');
			});
		} else {
			resolve('`I could not find ' + _name + ' please use an existing username`');
		}
	});
	return pResult;
}

// Build stats for game
function gameStats(_name, _db, _serverID, _bot) {
	const pResult = new Promise(function(resolve, reject) {
		_db.getGame(_serverID, _name)
		.then(function(data) {

			const embed = initCustomRichEmbed(_serverID, _bot);

			// Calculate total time played and build players message
			const guildMembers = _bot.guilds.get(_serverID).members;
			let totalPlayed = 0;
			let playersMsg = '';
			let displayName = '';
			data.forEach((player) => {
				totalPlayed += player.total;
				displayName = guildMembers.get(player._id).displayName;
				playersMsg += displayName + ': ' + buildTimeString(player.total) + '\n';
			});

			// Build general stats
			let generalStatsMsg = 'Played by a total of *' + data.length + '*  users';
			generalStatsMsg += '\n';
			generalStatsMsg += 'Total time played: ' + buildTimeString(totalPlayed);
			generalStatsMsg += '\n';

			// Build message embed
			embed.setAuthor(_name);
			embed.setTitle('Overall statistics for this game:');
			embed.setDescription(generalStatsMsg);
			embed.addField('Players:', playersMsg, true);

			// Fetch cover and url
			async.parallel([
				async.asyncify(() => findGameURL(_name)),
				async.asyncify(() => findGameCover(_name)),
			],
			(err, result) => {
				if (err == null) {
					embed.setURL(result[0]);
					if (result[1] != null) {
						embed.setThumbnail(result[1]);
					}
				}
				resolve({ embed: embed });
			});
		}).catch(function(err) {
			resolve('`' + err + '`');
		});
	});
	return pResult;
}

// Export DB as JSON
function exportJSON(_sender, _server, _bot, _db) {
	const pResult = new Promise(function(resolve, reject) {
		// Needs to be admin to export db
		if (_sender.permissions.hasPermission('ADMINISTRATOR')) {
			// Export data
			_db.getAllDataForServer(_server)
			.then(function(_data) {
				// Create buffer from string representation of data and send it
				_sender.sendFile(
					Buffer.from(JSON.stringify(_data, null, '\t')),
					'export.JSON',
					'Data export finished'
				)
				.then(function(_msg) {
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

// Display help
function help(_cfg) {
	const pResult = new Promise(function(resolve, reject) {
		const prefix = _cfg.commandPrefix;
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

// Report unknown command
function unknownCmd(_cfg) {
	const pResult = new Promise(function(resolve, reject) {
		resolve('`I do not know that command! Please use ' + _cfg.commandPrefix + 'Help to list available commands.`');
	});
	return pResult;
}

// Initialises RichEmbed with default options and customizations applied
function initCustomRichEmbed(_serverID, _bot) {
	const embed = new RichEmbed();
	const server = _bot.guilds.get(_serverID);
	const member = server.members.get(_bot.user.id);

	// Set color to highest groups color
	const color = member.highestRole.color;
	embed.setColor(color);

	// Set timestamp
	embed.setTimestamp();

	// Set footer
	embed.setFooter(
		'Powered by discord-playtime',
		'https://assets-cdn.github.com/favicon.ico'
	);

	return embed;
}

// Builds a Markdown string representing the given game title
function buildGameEntry(game) {
	const pTitle = new Promise((resolve, reject) => {
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

// Searches for the game on igdb an returns a promise to its url
function findGameURL(game) {
	const pURL = new Promise((resolve, reject) => {
		igdb.games({ search: game, fields: 'url' })
		.then((response) => {
			resolve(response.body[0].url);
		}).catch((err) => {
			reject(err);
		});
	});
	return pURL;
}

// Searches for the games cover on igdb
// Returns the covers url
function findGameCover(game) {
	const pCover = new Promise((resolve, reject) => {
		igdb.games({ search: game, fields: 'cover' })
		.then((response) => {
			resolve('https:' + response.body[0].cover.url);
		}).catch((err) => {
			console.log(err);
			resolve(null);
		});
	});
	return pCover;
}

// Builds a string representing the given duration accuratly to the minute
// _duration is in miliseconds
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

export default handleCommand;
