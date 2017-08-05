// @flow
import express from 'express';
import * as discord from 'discord.js';
import logging from 'util/log';
import type { Client } from 'discord.js';
import type DBConnector from './database';
import type { $Application, $Response, $Request } from 'express';

const logger = logging('playtime:healthcheck');

// $FlowIssue missing in libdef
const { Constants } = discord;

class HealthcheckEndpoint {

	djsClient: Client
	db: DBConnector
	endpoint: $Application

	constructor(client: Client, db: DBConnector) {
		this.djsClient = client;
		this.db = db;
		this.endpoint = express();
		// $FlowIssue missing in lbdef
		this.endpoint.get('/health', (req: $Request, res: $Response) => {
			if (this.isHealthy()) {
				res.status(200).json({ status: 'healthy' });
			} else {
				res.status(500).json({ status: 'unhealthy' });
			}
		});
	}

	listen(port: number) {
		this.endpoint.listen(port);
	}

	dbIsHealthy(): boolean {
		return this.db.connectionStatus() === 0;
	}

	djsIsHealthy(): boolean {
		return this.djsClient.status === Constants.Status.READY;
	}

	isHealthy(): boolean {
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
