/* eslint-env jest */
import HealthcheckEndpoint from '../healthcheckEndpoint';
import { Constants } from 'discord.js';

const mockClient = {
	status: Constants.Status.READY,
};
const mockDB = {
	connectionStatus: jest.fn(() => 0),
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

const endpoint = new HealthcheckEndpoint(mockClient, mockDB);

describe('HealthcheckEndpoint', () => {

	afterEach(() => {
		mockClient.status = Constants.Status.READY;
		mockResponse.status.mockClear();
	});

	test('responds with http 500 on non READY djs connection', () => {
		mockClient.status = Constants.Status.IDLE;
		expect(endpoint.isHealthy()).toBeFalsy();
		mockGetCallback(undefined, mockResponse);
		expect(mockResponse.status).toBeCalledWith(500);
	});

	test('responds with http 500 on non READY db connection', () => {
		mockDB.connectionStatus.mockImplementationOnce(() => 1);
		mockDB.connectionStatus.mockImplementationOnce(() => 1);
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
