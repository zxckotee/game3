const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]'
        }
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: process.env.REACT_APP_PORT || 443,
    hot: true,
    open: true,
    host: '0.0.0.0',
    allowedHosts: 'all',
    // HTTPS конфигурация с SSL сертификатами
    https: process.env.HTTPS === 'true' ? {
      key: fs.existsSync(path.resolve(__dirname, 'ssl/culty.ru.key'))
        ? fs.readFileSync(path.resolve(__dirname, 'ssl/culty.ru.key'))
        : undefined,
      cert: fs.existsSync(path.resolve(__dirname, 'ssl/culty.ru.crt'))
        ? fs.readFileSync(path.resolve(__dirname, 'ssl/culty.ru.crt'))
        : undefined
    } : false,
    // Проксирование API запросов
    proxy: {
      '/api': {
        target: process.env.REACT_APP_API_URL_HTTPS || process.env.REACT_APP_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Forwarded-Proto': 'https'
        }
      }
    },
    // Настройки клиента
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets',
          to: 'assets'
        }
      ]
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "url": require.resolve("url/"),
      "path": require.resolve("path-browserify"),
      "util": require.resolve("util/"),
      "assert": require.resolve("assert/"),
      "fs": false,
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify"),
      "vm": require.resolve("vm-browserify"),
      "querystring": false
    }
  }
};
