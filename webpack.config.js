const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const pages = [
  'index',
  'product',
  'login',
  'register',
  'user',
  'cart',
  'order',
  'order-detail',
  'compare',
];

const entries = pages.reduce((result, page) => {
  result[page] = path.resolve(__dirname, `src/pages/${page}/${page}.js`);
  return result;
}, {});

const htmlPlugins = pages.map(
  (page) =>
    new HtmlWebpackPlugin({
      filename: page === 'index' ? 'index.html' : `${page}.html`,
      template: path.resolve(__dirname, `src/pages/${page}/${page}.html`),
      chunks: [page],
      inject: 'body',
    }),
);

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: entries,
    output: {
      filename: isProduction ? 'assets/js/[name].[contenthash:8].js' : 'assets/js/[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: '/',
      assetModuleFilename: 'assets/media/[name].[hash:8][ext]',
    },
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: '> 0.5%, last 2 versions, not dead',
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp|woff2?|ttf|eot)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      ...htmlPlugins,
      new webpack.DefinePlugin({
        'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || '/api'),
      }),
      new MiniCssExtractPlugin({
        filename: 'assets/css/[name].[contenthash:8].css',
      }),
    ],
    devServer: {
      static: [
        {
          directory: path.resolve(__dirname, 'dist'),
        },
        {
          directory: path.resolve(__dirname, 'src'),
          publicPath: '/src',
        },
      ],
      port: 3000,
      historyApiFallback: false,
      hot: true,
      open: false,
      proxy: [
        {
          context: ['/api'],
          target: process.env.API_TARGET || 'http://localhost:1145',
          changeOrigin: true,
          pathRewrite: { '^/api': '' },
        },
      ],
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
    resolve: {
      extensions: ['.js'],
    },
  };
};
