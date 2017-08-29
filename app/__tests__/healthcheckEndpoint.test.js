/* eslint-env jest */
import HealthcheckEndpoint from '../healthcheckEndpoint';
import { Constants } from 'discord.js';
import mongoose from 'mongoose';

const mockClient = {
	status: Constants.Status.READY,
};

const mockResponse = {
	status: jest.fn(() => ({
		json: jest.fn(() => {}),
	})),
};

let mockGetCallback;
const mockGetFn = jest.fn((path, callback) => {
	mockGetCallback = callback;
});

jest.mock('express', () => (
	() => ({
		get: mockGetFn,
	})
));

jest.mock('mongoose', () => ({
	connection: {
		readyState: 1,
	},
}));

const endpoint = new HealthcheckEndpoint(mockClient);

describe('HealthcheckEndpoint', () => {

	afterEach(() => {
		mockClient.status = Constants.Status.READY;
		mongoose.connection.readyState = 1;
		mockResponse.status.mockClear();
	});

	test('responds with http 500 on non READY djs connection', () => {
		mockClient.status = Constants.Status.IDLE;
		expect(endpoint.isHealthy()).toBeFalsy();
		mockGetCallback(undefined, mockResponse);
		expect(mockResponse.status).toBeCalledWith(500);
	});

	test('responds with http 500 on non READY db connection', () => {
		mongoose.connection.readyState = 0;
		expect(endpoint.isHealthy()).toBeFalsy();
		mockGetCallback(undefined, mockResponse);
		expect(mockResponse.status).toBeCalledWith(500);
	});

	test('responds with http 200 on healthy state', () => {
		expect(endpoint.isHealthy()).toBeTruthy();
		mockGetCallback(undefined, mockResponse);
		expect(mockResponse.status).toBeCalledWith(200);
	});
});
