/**
 * Скрипт для исправления циклических зависимостей в моделях
 * Заменяет импорт unifiedDatabase на прямой доступ к connectionProvider
 */

const fs = require('fs');
const path = require('path');

// Целевой каталог с моделями
const modelsDir = path.join(__dirname);

// Регулярные выражения для замены
const importRegex = /const\s*{\s*unifiedDatabase\s*}\s*=\s*require\s*\(\s*['"]\.\.\/services\/database-connection-manager-adapter['"]\s*\)\s*;/;
const replacementImport = "const connectionProvider = require('../utils/connection-provider');";

const functionCallRegex = /await\s+unifiedDatabase\.getSequelizeInstance\(\)/g;
const replacementCall = "await connectionProvider.getSequelizeInstance()";

// Функция для обработки файла
function processFile(filePath) {
  //console.log(`Обработка файла: ${filePath}`);
  
  try {
    // Чтение файла
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверка наличия циклической зависимости
    if (importRegex.test(content)) {
      console.log(`- Найдена циклическая зависимость в ${filePath}`);
      
      // Замена импорта
      content = content.replace(importRegex, replacementImport);
      
      // Замена вызовов функции
      content = content.replace(functionCallRegex, replacementCall);
      
      // Запись обновленного содержимого
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`- Файл успешно обновлен: ${filePath}`);
    } else {
      //console.log(`- Циклическая зависимость не найдена в ${filePath}`);
    }
  } catch (error) {
    console.error(`Ошибка при обработке файла ${filePath}:`, error);
  }
}

// Получение списка файлов .js
const files = fs.readdirSync(modelsDir).filter(file => {
  return file.endsWith('.js') && 
         file !== 'index.js' &&
         file !== 'fix-circular-dependency.js' &&
         file !== 'fix-model-associations.js' &&
         file !== 'fix-models.js' &&
         file !== 'initialize-stubs.js';
});

// Обработка каждого файла
//console.log(`Найдено ${files.length} файлов моделей для обработки`);
files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  processFile(filePath);
});

console.log('Обработка завершена');