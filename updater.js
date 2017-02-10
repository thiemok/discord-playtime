function Updater(_bot, _db, _updateInterval) {
	this.db = _db;
	this.bot = _bot;
	this.updateInterval = _updateInterval;
}

Updater.prototype.updateStats = function() {
    var users = new Map();
    var presence = null;
    var servers = this.bot.guilds;
    //Fetch users and games
	servers.every((server, index, servers) => {
        //Check for server availability
        if (server.available) {
        	var members = server.members;
        	var serverId = server.id;
        	//Build data
        	members.every((member, id, server) => {
                var presence = member.presence; 
                if (presence.game != null && presence.status != 'idle') {
                    //Add user to collection if necessary
                    if (!users.has(member.id)) {
                    	users.set(member.id, {servers: new Array(), game: ''});
                    }
                	//Add current server to server list
        		    users.get(member.id).servers.push(serverId);
        		    //Add game
        		    users.get(member.id).game = presence.game.name;
        	    }
                return true;
        	}, this);
        }

        return true;
	}, this);

	//Write to db
	for (let [id, data] of users) {
		this.db.updateUser(id, data.game, data.servers, this.updateInterval);
	}
};

module.exports = Updater;