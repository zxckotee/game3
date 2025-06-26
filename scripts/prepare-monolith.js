/**
 * Скрипт для подготовки монолитного приложения
 * 
 * Этот скрипт копирует сборку клиентской части (статические файлы из build)
 * в директорию, откуда они будут обслуживаться сервером Express.
 */

const fs = require('fs-extra');
const path = require('path');

// Путь к сборке клиентской части
const buildDir = path.join(__dirname, '../build');

console.log(`Копирование статических файлов из ${buildDir}`);

// Проверяем существование директории сборки
if (!fs.existsSync(buildDir)) {
  console.error('Ошибка: Директория build не найдена');
  console.error('Сначала выполните сборку клиентской части: npm run build');
  process.exit(1);
}

// Создаем папку для монолитного приложения, если она не существует
const monoDir = path.join(__dirname, '../monolith');
fs.ensureDirSync(monoDir);

// Копируем серверные файлы
const serverDir = path.join(__dirname, '../src');
const targetServerDir = path.join(monoDir, 'server');

console.log(`Копирование серверных файлов из ${serverDir} в ${targetServerDir}`);
fs.copySync(serverDir, targetServerDir, {
  filter: (src, dest) => {
    // Пропускаем файлы, которые не нужны на сервере
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /\.vscode/,
      /build/
    ];
    
    return !excludePatterns.some(pattern => pattern.test(src));
  }
});

// Копируем сборку клиентской части в директорию monolith/public
const publicDir = path.join(monoDir, 'public');
console.log(`Копирование статических файлов из ${buildDir} в ${publicDir}`);
fs.copySync(buildDir, publicDir);

// Создаем скрипт запуска для монолитного приложения
const startScript = `
#!/usr/bin/env node
/**
 * Скрипт запуска монолитного приложения
 */
const path = require('path');
process.env.NODE_ENV = 'production';
process.env.PUBLIC_PATH = path.join(__dirname, 'public');

// Запускаем сервер
require('./server/server.js');
`;

fs.writeFileSync(path.join(monoDir, 'start.js'), startScript);
fs.chmodSync(path.join(monoDir, 'start.js'), '755');

// Создаем package.json для монолитного приложения
const packageJson = {
  name: "immortal-path-monolith",
  version: "1.0.0",
  description: "Монолитное приложение Путь к Бессмертию",
  main: "start.js",
  scripts: {
    "start": "node start.js"
  },
  dependencies: {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "sequelize": "^6.12.0",
    "pg": "^8.15.6",
    "bcryptjs": "^3.0.2"
  }
};

fs.writeFileSync(
  path.join(monoDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('Монолитное приложение успешно подготовлено!');
console.log(`Для запуска выполните: cd ${monoDir} && npm start`);