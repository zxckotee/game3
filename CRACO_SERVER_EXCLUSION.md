# 🔧 Исключение server папки из React сборки

## 🎯 Решение проблемы crypto-browserify

Нужно добавить в `craco.config.js` правило для исключения папки `src/server` из React сборки.

## 📝 Обновленный craco.config.js

Добавьте в секцию `module.rules` следующее правило:

```javascript
const webpack = require('webpack');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Остальные настройки
      return {
        ...webpackConfig,
        // Добавляем pg в список внешних модулей, чтобы webpack не пытался его включить в клиентскую сборку
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
            // Добавленные fallback для решения проблем компиляции pg
            "dns": false,
            "net": false,
            "tls": false,
            "cloudflare:sockets": false,
            // Дополнительные модули для исправления проблемы
            "child_process": false,
            "os": false,
            "http": false,
            "https": false,
            "zlib": false,
            "path": false,
            "querystring": false
          },
          // Явное игнорирование проблемных модулей
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
          // Добавляем плагин для явного исключения pg и связанных модулей
          new webpack.NormalModuleReplacementPlugin(
            /pg|pg-hstore|pg-native/,
            'empty-module'
          )
        ],
        module: {
          ...webpackConfig.module,
          rules: [
            ...(webpackConfig.module?.rules || []),
            {
              test: /\.js$/,
              enforce: "pre",
              use: ["source-map-loader"],
              exclude: /node_modules/
            },
            // НОВОЕ ПРАВИЛО: Исключить server папку из React сборки
            {
              test: /\.js$/,
              include: [
                path.resolve(__dirname, 'src/server'),
                path.resolve(__dirname, 'src/services')
              ],
              use: 'null-loader'
            }
          ]
        },
        ignoreWarnings: [
          // Игнорируем предупреждения о source maps
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
          // Игнорируем предупреждения о критических зависимостях
          /Critical dependency: the request of a dependency is an expression/,
          // Игнорируем предупреждения о нехватке модулей
          /Module not found: Error: Can't resolve/,
          // Игнорируем предупреждения о схеме
          /UnhandledSchemeError: Reading from "cloudflare:sockets" is not handled by plugins/,
          // Игнорируем предупреждения о динамических выражениях
          /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/
        ],
        // Настраиваем модульную оптимизацию для лучшей совместимости
        optimization: {
          ...webpackConfig.optimization,
          // Улучшаем обработку модулей, связанных с pg
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
      // Здесь можно добавить любую логику, которая была в onBeforeSetupMiddleware и onAfterSetupMiddleware
      return middlewares;
    },
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 80,
    // Добавляем проксирование API-запросов на сервер Express во время разработки
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Порт на котором запущен Express сервер
        changeOrigin: true
      }
    }
  }
};
```

## 🔧 Ключевые изменения:

### 1. Добавлено правило исключения:
```javascript
{
  test: /\.js$/,
  include: [
    path.resolve(__dirname, 'src/server'),
    path.resolve(__dirname, 'src/services')
  ],
  use: 'null-loader'
}
```

### 2. Обновлены ignoreWarnings:
```javascript
warning.module.resource.includes('src/server') ||
warning.module.resource.includes('src/services')
```

## 🎯 Что это делает:

- **null-loader** заменяет содержимое файлов из `src/server` и `src/services` на пустые модули
- **React не пытается** собирать серверный код с Node.js crypto
- **Исключаются предупреждения** о серверных файлах
- **Сохраняется функциональность** - серверный код работает на сервере, клиентский в браузере

## 🚀 Команды для применения:

```bash
# Остановить контейнеры
docker-compose down

# Применить изменения в craco.config.js
# (скопировать код выше)

# Очистить кэш и пересобрать
docker-compose -f docker-compose-simple.yml up -d --build
```

## 📋 Альтернативное решение:

Если null-loader не работает, можно использовать ignore-loader:

```bash
npm install --save-dev ignore-loader
```

И заменить `'null-loader'` на `'ignore-loader'`.

Это должно окончательно решить проблему с crypto-browserify!