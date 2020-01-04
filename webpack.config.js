const path = require('path');

module.exports = {
  entry: {
    ts: 'src/ts/background.ts'
  },
  output: {
    path: path.join(__dirname, 'app'),
    filename: '[name]/background.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  }
}