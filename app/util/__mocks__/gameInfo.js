/* eslint-env jest */
const gameInfo = jest.genMockFromModule('../gameInfo');

gameInfo.findGameURL = jest.fn(name => Promise.resolve('https://testurl.com'));
gameInfo.findGameCover = jest.fn(name => Promise.resolve('https://testurl.com'));

export default gameInfo;
