/* eslint-env jest */
const stringHelpers = jest.genMockFromModule('../stringHelpers');

stringHelpers.buildRichGameString = jest.fn(game => game);

export default stringHelpers;
