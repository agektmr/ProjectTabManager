import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const src = path.join(__dirname, 'src');
const dst = path.join(__dirname, 'app');

module.exports = {
  mode: "development",
  devtool: 'inline-source-map',
  entry: {
    'js/background': './src/ts/background.ts',
    'js/lazy': './src/ts/lazy.ts',
    'components/ptm-app': './src/components/ptm-app.ts',
    'styles/default-theme': './src/styles/default-theme.scss'
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
    rules: [{
      test: /\.ts$/,
      loader: 'ts-loader',
      exclude: /node_modules/
    }, {
      test: /\.scss$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: path.join('styles', 'default-theme.css')
          }
        },
        { loader: 'extract-loader' },
        { loader: 'css-loader' },
        {
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
            sassOptions: {
              includePaths: ['./node_modules']
            }
          }
        }
      ]
    }]
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
      from: path.join(src, '*.html'),
      to: dst,
      flatten: true
    },{
      from: path.join(src, 'manifest.json'),
      to: path.join(dst, 'manifest.json')
    }])
  ]
}