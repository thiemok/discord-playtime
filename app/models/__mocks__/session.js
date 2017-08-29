// const Session = jest.genMockFromModule('../session');
const Session = {};

let mockData = {};

const __setMockData = (data) => {
	mockData = Object.assign({}, data);
	mockData.sessions = [];
};

const __getMockData = () => mockData;

Session.create = jest.fn((data) => {
	if (Array.isArray(data)) {
		const { sessions } = mockData;
		mockData.sessions = sessions.concat(data);
	} else {
		mockData.sessions.push(data);
	}
	return Promise.resolve();
});
Session.findGameRecordsForPlayer = jest.fn(id => Promise.resolve(mockData.gamesForPlayer));
Session.findTopPlayersForGuild = jest.fn(id => Promise.resolve(mockData.topPlayers));
Session.findTopGamesForGuild = jest.fn(id => Promise.resolve(mockData.topGames));
Session.findTotalTimeForGuild = jest.fn(id => Promise.resolve(mockData.totalTimeplayed));
Session.findPlayerRecordsForGame = jest.fn((id, name) => Promise.resolve(mockData.game));
Session.allSessionsForGuild = jest.fn((id, name) => Promise.resolve(mockData));
Session.__setMockData = __setMockData;
Session.__getMockData = __getMockData;

export default Session;
