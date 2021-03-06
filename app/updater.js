// @flow
import logging from 'util/log';
import type { GuildMember, Client } from 'discord.js';
import Session from 'models/session';

const logger = logging('playtime:updater');

export class ActiveSession {

	game: string
	startDate: Date
	member: GuildMember
	servers: Array<string>

	constructor(game: string, member: GuildMember, servers: Array<string>) {
		this.game = game;
		this.startDate = new Date();
		this.member = member;
		this.servers = servers;
	}
}

class Updater {

	client: Client
	activeSessions: Map<string, Session>

	constructor(client: Client) {
		this.client = client;
		this.activeSessions = new Map();
	}

	// Handle updated presences
	presenceUpdated(oldMember: GuildMember, newMember: GuildMember) {
		this.closeSession(newMember);
		this.openSession(newMember);
	}

	// Checks if the given member needs tracking
	needsTracking(member: GuildMember): boolean {
		if (member.presence.game == null) return false;
		if (member.presence.status === 'idle') return false;
		if (member.user.bot) return false;

		const openSession = this.activeSessions.get(member.id);
		if (openSession != null && openSession.game === member.presence.game.name) return false;

		return true;
	}

	// Checks if the session of the given member needs closing
	needsClosing(member: GuildMember): boolean {
		if (!this.activeSessions.has(member.id)) return false;
		if (member.presence.status === 'idle') return true;
		if (member.presence.status === 'offline') return true;
		if (member.presence.game == null) return true;

		const openSession = this.activeSessions.get(member.id);
		if (openSession != null && openSession.game !== member.presence.game.name) return true;

		return false;
	}

	// Start a session for the given member of needed
	openSession(member: GuildMember) {
		// Check if member needs tracking
		if (this.needsTracking(member)) {
			logger.debug('Opening session for %s', member.displayName);
			const servers = [];
			this.client.guilds.forEach((server, sid) => {
				if (server.available) {
					if (server.members.has(member.id)) {
						servers.push(sid);
					}
				}
			});
			const session = new ActiveSession(member.presence.game.name, member, servers);
			this.activeSessions.set(member.id, session);
		}
	}

	// Closes, if needed or forced, the session of the given member and writes it to the db
	async closeSession(member: GuildMember, force: boolean = false): Promise<> {
		// Check if is forced or needs closing
		if (force || this.needsClosing(member)) {
			logger.debug('Closing session for %s', member.displayName);
			// Write session to db
			const openSession = this.activeSessions.get(member.id);
			if (openSession != null) {

				this.activeSessions.delete(member.id);

				return Session.create({
					uid: openSession.member.id,
					game: openSession.game,
					duration: Date.now() - openSession.startDate.getTime(),
					ended: new Date(),
					guilds: openSession.member.client.guilds.keyArray(),
				});
			}
		}
		return Promise.resolve();
	}

	// Start tracking users presences
	start() {
		logger.debug('Starting tracking');
		// Start Sessions for already connected and playing users
		this.client.guilds.forEach((guild) => {
			guild.members.forEach((member) => {
				this.openSession(member);
			});
		});

		// Act on Users changeing state
		this.client.on('presenceUpdate', this.presenceUpdated.bind(this));
	}

	// Stop tracking user presences
	async stop() {
		logger.debug('Stopping tracking');
		// Remove event listener
		this.client.removeListener('presenceUpdated', this.presenceUpdated);
		// Close all open Sessions
		const tasks = [];
		this.activeSessions.forEach((session) => {
			tasks.push(this.closeSession(session.member, true));
		});
		return Promise.all(tasks);
	}
}

export default Updater;
