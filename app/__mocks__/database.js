/* eslint-env jest */
const db = jest.genMockFromModule('../database');

let mockData = {};

const __setMockData = (data) => {
	mockData = Object.assign({}, data);
};

db.getTopPlayers = jest.fn(id => mockData.topPlayers);
db.getTopGames = jest.fn(id => mockData.topGames);
db.getTotalTimePlayed = jest.fn(id => mockData.totalTimeplayed);

db.__setMockData = __setMockData;

export default db;
