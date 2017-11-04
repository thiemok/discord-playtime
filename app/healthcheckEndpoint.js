// @flow
import express, { type $Application, type $Response, type $Request } from 'express';
import * as discord from 'discord.js';
import type { Client } from 'discord.js';
import logging from 'util/log';
import mongoose from 'mongoose';

const logger = logging('playtime:healthcheck');

// $FlowIssue missing in libdef
const { Constants } = discord;

function dbIsHealthy(): boolean {
	return mongoose.connection.readyState === 1;
}

class HealthcheckEndpoint {

	djsClient: Client
	endpoint: $Application

	constructor(client: Client) {
		this.djsClient = client;
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

	djsIsHealthy(): boolean {
		return this.djsClient.status === Constants.Status.READY;
	}

	isHealthy(): boolean {
		if (!this.djsIsHealthy()) {
			logger.debug('Discord connection died');
			return false;
		}
		if (!dbIsHealthy()) {
			logger.debug('DB connection died');
			return false;
		}

		return true;
	}


}

export default HealthcheckEndpoint;
