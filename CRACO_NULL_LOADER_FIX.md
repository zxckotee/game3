# 🚨 Исправление ошибки null-loader

## Проблема:
```
Module not found: Error: Can't resolve 'null-loader' in 'C:\backups\game3'
```

null-loader не установлен и правило применяется ко всем компонентам!

## 🔧 СРОЧНОЕ исправление craco.config.js

Нужно заменить правило с null-loader на встроенные возможности webpack.

### Заменить это правило:
```javascript
// УБРАТЬ ЭТО:
{
  test: /\.js$/,
  include: [
    path.resolve(__dirname, 'src/server'),
    path.resolve(__dirname, 'src/services')
  ],
  use: 'null-loader'
}
```

### На это:
```javascript
// ЗАМЕНИТЬ НА ЭТО:
{
  test: /\.js$/,
  include: [
    path.resolve(__dirname, 'src/server'),
    path.resolve(__dirname, 'src/services')
  ],
  use: {
    loader: 'file-loader',
    options: {
      emitFile: false,
      name: '[name].[ext]'
    }
  }
}
```

## 🎯 Альтернативное решение - использовать exclude:

Еще лучше - просто исключить server папку из обработки:

```javascript
module: {
  ...webpackConfig.module,
  rules: [
    ...(webpackConfig.module?.rules || []),
    {
      test: /\.js$/,
      enforce: "pre",
      use: ["source-map-loader"],
      exclude: [
        /node_modules/,
        path.resolve(__dirname, 'src/server'),
        path.resolve(__dirname, 'src/services')
      ]
    }
  ]
}
```

## 🚀 САМОЕ ПРОСТОЕ решение:

Добавить в resolve.alias:

```javascript
resolve: {
  ...webpackConfig.resolve,
  alias: {
    ...webpackConfig.resolve.alias,
    "cloudflare:sockets": false,
    "pg-native": false,
    "pg": false,
    "pg-hstore": false,
    "sequelize": path.resolve(__dirname, 'src/sequelize-config.js'),
    // ДОБАВИТЬ ЭТИ СТРОКИ:
    "@server": false,
    "@services": false
  }
}
```

## 📋 Полный исправленный craco.config.js:

```javascript
const webpack = require('webpack');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      return {
        ...webpackConfig,
        externals: {
          ...webpackConfig.externals,
          'pg': 'pg',
          'pg-hstore': 'pg-hstore',
          'pg-native': 'pg-native',
          'cloudflare:sockets': 'cloudflare:sockets'
        },
        resolve: {
          ...webpackConfig.resolve,
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
            "dns": false,
            "net": false,
            "tls": false,
            "cloudflare:sockets": false,
            "child_process": false,
            "os": false,
            "http": false,
            "https": false,
            "zlib": false,
            "path": false,
            "querystring": false
          },
          alias: {
            "cloudflare:sockets": false,
            "pg-native": false,
            "pg": false,
            "pg-hstore": false,
            "sequelize": path.resolve(__dirname, 'src/sequelize-config.js')
          }
        },
        plugins: [
          ...(webpackConfig.plugins || []),
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
          }),
          new webpack.NormalModuleReplacementPlugin(
            /pg|pg-hstore|pg-native/,
            'empty-module'
          ),
          // ДОБАВИТЬ: Исключить server файлы
          new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/server/,
            contextRegExp: /src$/
          })
        ],
        module: {
          ...webpackConfig.module,
          rules: [
            ...(webpackConfig.module?.rules || []),
            {
              test: /\.js$/,
              enforce: "pre",
              use: ["source-map-loader"],
              exclude: [
                /node_modules/,
                path.resolve(__dirname, 'src/server'),
                path.resolve(__dirname, 'src/services')
              ]
            }
          ]
        },
        ignoreWarnings: [
          function ignoreSourcemapsloaderWarnings(warning) {
            return (
              warning.module &&
              warning.module.resource &&
              (warning.module.resource.includes('node_modules/sequelize-pool') ||
               warning.module.resource.includes('node_modules/sequelize') ||
               warning.module.resource.includes('node_modules/pg') ||
               warning.module.resource.includes('node_modules/cloudflare') ||
               warning.module.resource.includes('src/server') ||
               warning.module.resource.includes('src/services'))
            );
          },
          /Critical dependency: the request of a dependency is an expression/,
          /Module not found: Error: Can't resolve/,
          /UnhandledSchemeError: Reading from "cloudflare:sockets" is not handled by plugins/,
          /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/
        ],
        optimization: {
          ...webpackConfig.optimization,
          splitChunks: {
            ...webpackConfig.optimization?.splitChunks,
            cacheGroups: {
              ...webpackConfig.optimization?.splitChunks?.cacheGroups,
              pgExclusion: {
                test: /[\\/]node_modules[\\/](pg|pg-hstore|pg-native)/,
                name: 'pg-modules',
                chunks: 'all',
                priority: 10,
                enforce: true
              }
            }
          }
        }
      };
    }
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      return middlewares;
    },
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 80,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
};
```

## 🎯 Ключевые изменения:

1. **Убрано правило с null-loader**
2. **Добавлен IgnorePlugin** для исключения server файлов
3. **Обновлен exclude** в source-map-loader
4. **Сохранены все остальные настройки**

Замените весь craco.config.js на код выше!