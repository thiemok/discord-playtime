import express from 'express';
import { Constants } from 'discord.js';
import logging from 'util/log';

const logger = logging('playtime:healthcheck');

class HealthcheckEndpoint {

	constructor(client, db) {
		this.djsClient = client;
		this.db = db;
		this.endpoint = express();
		this.endpoint.get('/health', (req, res) => {
			if (this.isHealthy()) {
				res.status(200).json({ status: 'healthy' });
			} else {
				res.status(500).json({ status: 'unhealthy' });
			}
		});
	}

	listen(port) {
		this.endpoint.listen(port);
	}

	dbIsHealthy() {
		return this.db.connectionStatus() === 0;
	}

	djsIsHealthy() {
		return this.djsClient.status === Constants.Status.READY;
	}

	isHealthy() {
		if (!this.djsIsHealthy()) {
			logger.debug('Discord connection died');
			return false;
		}
		if (!this.dbIsHealthy()) {
			logger.debug('DB connection died');
			return false;
		}

		return true;
	}


}

export default HealthcheckEndpoint;
