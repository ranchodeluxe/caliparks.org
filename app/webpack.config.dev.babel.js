import path from 'path';
import Clean from 'clean-webpack-plugin';
import SvgStore from 'webpack-svgstore-plugin';
import webpack from 'webpack';

export default {
  devtool: 'eval',
  entry: [
    'babel-core/polyfill',
    'webpack-hot-middleware/client',
    './public/index.js',
    './styles/app.scss'
  ],

  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: '/'
  },

  eslint: {
    configFile: path.join(__dirname, '.eslintrc')
  },

  module: {
    preLoaders: [
      {
        test: /\.jsx?$/,
        loader: 'eslint',
        exclude: [/node_modules/, /react-fullpage/, /react-slick/, /socs.js/]
      }
    ],

    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        query: {
          stage: 0,
          plugins: [
            'react-transform'
          ],
          extra: {
            'react-transform': {
              transforms: [
                {
                  transform: 'react-transform-hmr',
                  imports: ['react'],
                  locals: ['module']
                }
              ]
            }
          },
          optional: [
            'es7.classProperties'
          ]
        },
        exclude: [/node_modules/]
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loaders: ['style', 'css', 'autoprefixer', 'sass']
      }
    ]
  },

  plugins: [
    // wipe any output files
    new Clean(['public/bundle.js*', 'public/styles.css*', 'public/main.svg']),
    // ensure consistent build hashes
    new webpack.optimize.OccurenceOrderPlugin(),
    // enable hot module replacement
    new webpack.HotModuleReplacementPlugin(),
    // don't generate assets containing errors
    new webpack.NoErrorsPlugin(),
    new SvgStore(path.join(__dirname + '/public/assets/svgs'), {
      // svg prefix
      svg: {
        style: 'position:absolute; width:0; height:0',
        xmlns: 'http://www.w3.org/2000/svg'
      },
      output: [
        {
          filter: 'all',
          sprite: 'main.svg'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      react: path.join(__dirname, 'node_modules/react'),
      'react-dom': path.join(__dirname, 'node_modules/react-dom')
    },
    extensions: ['', '.js', '.jsx', '.json']
  }
};
