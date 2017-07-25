import parallel from 'async/parallel';

class Session {
	constructor(_game, _member, _servers) {
		this.game = _game;
		this.startDate = new Date();
		this.member = _member;
		this.servers = _servers;
	}
}

class Updater {
	constructor(_bot, _db) {
		this.db = _db;
		this.bot = _bot;
		this.activeSessions = new Map();

		// Handle updated presences
		this.presenceUpdated = (oldMember, newMember) => {
			this.closeSession(newMember);
			this.openSession(newMember);
		};
	}

	// Checks if the given member needs tracking
	needsTracking(member) {
		let needsTracking = true;
		// Check if member is not playing
		if (member.presence.game == null) {
			needsTracking = false;

			// Check if member is already tracked
		} else if (this.activeSessions.has(member.id)) {
			// Check if game is equal to open session
			if (this.activeSessions.get(member.id).game === member.presence.game.name) {
				needsTracking = false;
			}

			// Check if member is afk
		} else if (member.presence.status === 'idle') {
			needsTracking = false;

			// Check if member is a bot
		} else if (member.user.bot) {
			needsTracking = false;
		}
		return needsTracking;
	}

	// Checks if the session of the given member needs closing
	needsClosing(member) {
		let needsClosing = false;

		// Check if member does have an open session
		if (this.activeSessions.has(member.id)) {

			// Check if member has gone afk
			if (member.presence.status === 'idle') {
				needsClosing = true;

				// Check if member has gone offline
			} else if (member.presence.status === 'offline') {
				needsClosing = true;

				// Check if member has stopped playing
			} else if (member.presence.game == null) {
				needsClosing = true;

				// Check if member changed game
			} else if (this.activeSessions.get(member.id).game !== member.presence.game.name) {
				needsClosing = true;
			}
		}

		return needsClosing;
	}

	// Start a session for the given member of needed
	openSession(member) {
		// Check if member needs tracking
		if (this.needsTracking(member)) {
			const servers = [];
			this.bot.guilds.forEach((sid, server) => {
				if (server.available) {
					if (server.members.has(member.id)) {
						servers.push(sid);
					}
				}
			});
			const session = new Session(member.presence.game.name, member, servers);
			this.activeSessions.set(member.id, session);
		}
	}

	// Closes, if needed or forced, the session of the given member and writes it to the db
	closeSession(member, callback, force = false) {
		// Check if is forced or needs closing
		if (force || this.needsClosing(member)) {
			// Write session to db
			this.db.insertSession(this.activeSessions.get(member.id), callback);

			this.activeSessions.delete(member.id);
		}
	}

	// Start tracking users presences
	start() {
		// Start Sessions for already connected and playing users
		this.bot.guilds.forEach((guild) => {
			guild.members.forEach((member) => {
				this.openSession(member);
			});
		});

		// Act on Users changeing state
		this.bot.on('presenceUpdate', this.presenceUpdated);
	}

	// Stop tracking user presences
	stop(_callback) {
		// Remove event listener
		this.bot.removeListener('presenceUpdated', this.presenceUpdated);
		// Close all open Sessions
		const tasks = [];
		this.activeSessions.forEach((session) => {
			tasks.push((callback) => {
				this.closeSession(session.member, callback, true);
			});
		});
		parallel(tasks, _callback);
	}
}

export default Updater;
