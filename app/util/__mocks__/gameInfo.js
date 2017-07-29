/* eslint-env jest */
const gameInfo = jest.genMockFromModule('../gameInfo');

gameInfo.findGameURL = jest.fn(name => new Promise((res, rej) => res('https://testurl.com')));
gameInfo.findGameCover = jest.fn(name => new Promise((res, rej) => res('https://testurl.com')));

export default gameInfo;
