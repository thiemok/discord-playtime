/* eslint-env jest */
const db = jest.genMockFromModule('../database');

let mockData = {};

const __setMockData = (data) => {
	mockData = Object.assign({}, data);
};

db.getTopPlayers = jest.fn(id => new Promise((res, rej) => res(mockData.topPlayers)));
db.getTopGames = jest.fn(id => new Promise((res, rej) => res(mockData.topGames)));
db.getTotalTimePlayed = jest.fn(id => new Promise((res, rej) => res(mockData.totalTimeplayed)));
db.getGamesforPlayer = jest.fn(id => new Promise((res, rej) => res(mockData.gamesForPlayer)));
db.getGame = jest.fn((id, name) => new Promise((res, rej) => res(mockData.game)));
db.getAllDataForServer = jest.fn((id, name) => new Promise((res, rej) => res(mockData)));

db.__setMockData = __setMockData;

export default db;
