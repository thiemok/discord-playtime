/* eslint-env jest */
const db = jest.genMockFromModule('../database');

let mockData = {};

const __setMockData = (data) => {
	mockData = Object.assign({}, data);
};

db.getTopPlayers = jest.fn(id => Promise.resolve(mockData.topPlayers));
db.getTopGames = jest.fn(id => Promise.resolve(mockData.topGames));
db.getTotalTimePlayed = jest.fn(id => Promise.resolve(mockData.totalTimeplayed));
db.getGamesforPlayer = jest.fn(id => Promise.resolve(mockData.gamesForPlayer));
db.getGame = jest.fn((id, name) => Promise.resolve(mockData.game));
db.getAllDataForServer = jest.fn((id, name) => Promise.resolve(mockData));

db.__setMockData = __setMockData;

export default db;
