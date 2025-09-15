export default {
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleFileExtensions: ['js', 'json', 'node']
};