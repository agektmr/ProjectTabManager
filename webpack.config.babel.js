import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const src = path.join(__dirname, 'src');
const dst = path.join(__dirname, 'app');

module.exports = {
  mode: "development",
  devtool: 'inline-source-map',
  entry: {
    'sw': './src/ts/background.ts',
    'js/lazy': './src/ts/lazy.ts',
    'js/web-animations-next-lite.min.js': './src/ts/web-animations-next-lite.min.js',
    'components/ptm-app': './src/components/ptm-app.ts'
  },
  output: {
    path: dst,
    filename: '[name].js'
  },
  devServer: {
    contentBase: __dirname,
    port: 8080,
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: path.join(src, '_locales'),
      to: path.join(dst, '_locales')
    },{
      from: path.join(src, 'img'),
      to: path.join(dst, 'img')
    },{
      from: path.join(src, 'styles'),
      to: path.join(dst, 'styles')
    },{
      from: path.join(src, '*.html'),
      to: dst,
      flatten: true
    },{
      from: path.join(src, 'manifest.json'),
      to: path.join(dst, 'manifest.json')
    }])
  ]
}