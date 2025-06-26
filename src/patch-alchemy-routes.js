/**
 * Скрипт для исправления маршрутов алхимии в server.js
 * Этот скрипт заменяет старые маршруты алхимии на подключение нового модуля
 */

const fs = require('fs');
const path = require('path');

const serverJsPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverJsPath, 'utf-8');

// Найдем начало блока с алхимией
const alchemyStartPattern = /\/\/ API маршруты для алхимии \(Alchemy API\)/;
const alchemyStart = content.match(alchemyStartPattern);
if (!alchemyStart) {
  console.error('Не удалось найти начало блока с маршрутами алхимии');
  process.exit(1);
}

// Найдем конец блока с алхимией (перед регистрацией остальных маршрутов)
const alchemyEndPattern = /\/\/ Регистрируем все остальные маршруты API/;
const alchemyEnd = content.match(alchemyEndPattern);
if (!alchemyEnd) {
  console.error('Не удалось найти конец блока с маршрутами алхимии');
  process.exit(1);
}

// Вычисляем границы для вырезания
const startIndex = alchemyStart.index;
const endIndex = alchemyEnd.index;

// Создаем новый блок с подключением модуля
const newAlchemyCode = `// Подключаем API маршруты для алхимии (Alchemy API)
console.log('Регистрация API маршрутов для алхимии...');
const registerAlchemyRoutes = require('./api-endpoints-alchemy');
registerAlchemyRoutes(app, Sequelize, getSequelizeInstance);

// Регистрируем все остальные маршруты API`;

// Заменяем старый блок на новый
const newContent = content.substring(0, startIndex) + newAlchemyCode + content.substring(endIndex + alchemyEndPattern.toString().length);

// Записываем обновленный файл
fs.writeFileSync(serverJsPath, newContent, 'utf-8');

console.log('Файл server.js успешно обновлен!');