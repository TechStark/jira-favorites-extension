const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');

const NODE_ENV = process.env.NODE_ENV || 'development';
const { ifProduction, ifDevelopment } = getIfUtils(NODE_ENV);

const getLessLoaders = (useModules) => {
  return [
    {
      loader: 'style-loader', // creates style nodes from JS strings
      options: {},
    },
    {
      loader: 'css-loader', // translates CSS into CommonJS
      options: useModules
        ? {
            modules: {
              localIdentName: '[name]__[local]--[hash:base64:5]',
            },
          }
        : {},
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: ['autoprefixer'],
        },
      },
    },
    {
      loader: 'less-loader', // compiles Less to CSS
      options: {
        lessOptions: {
          // modifyVars: {
          //   'primary-color': '#1DA57A',
          //   'link-color': '#1DA57A',
          //   'border-radius-base': '2px'
          // },
          javascriptEnabled: true,
        },
      },
    },
  ];
};

module.exports = {
  mode: NODE_ENV,
  entry: {
    'content-script': ['./src/content-script.js'],
    background: ['./src/background.js'],
    starList: ['./src/pages/starList.js'],
  },
  output: {
    path: path.join(__dirname, 'build/dist'),
    filename: '[name].bundle.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'src'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: './build/babel_cache',
            },
          },
        ],
      },

      // CSS
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },

      // LESS
      { test: /\.less$/, include: [path.resolve(__dirname, 'src')], use: getLessLoaders(true) },
      { test: /\.less$/, exclude: [path.resolve(__dirname, 'src')], use: getLessLoaders(false) },
    ],
  },

  plugins: removeEmpty([
    ifProduction(new CleanWebpackPlugin()),
    new ExtensionReloader({
      reloadPage: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json' },
        { from: './src/icons', to: 'icons' },
        { from: './src/pages/starList.html' },
      ],
    }),
  ]),

  devtool: ifDevelopment('inline-source-map'),
};
