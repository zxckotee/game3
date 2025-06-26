/**
 * Скрипт для удаления самоинициализации из всех файлов моделей
 * Запускается: node src/models/remove-self-init.js
 */
const fs = require('fs');
const path = require('path');

// Путь к директории моделей
const modelsDir = path.join(__dirname);

// Шаблон, который нужно найти и заменить
const selfInitRegex = /\/\/ Инициализируем модель сразу(?:.|\n)*?\(\s*async\s*\(\s*\)\s*=>\s*\{(?:.|\n)*?try\s*\{(?:.|\n)*?await\s*[A-Za-z]+\.init\(\);(?:.|\n)*?}\s*catch\s*\([A-Za-z]+\)\s*\{(?:.|\n)*?}\s*\}\)\(\);/g;

// Шаблон для замены
const replacementText = '// Больше не используем самоинициализацию через IIFE\n// Инициализация будет происходить централизованно через src/models/initializeModels.js';

// Функция для обработки файла модели
function processModelFile(filePath) {
  try {
    // Читаем содержимое файла
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, содержит ли файл шаблон самоинициализации
    if (!selfInitRegex.test(content)) {
      //console.log(`Файл ${filePath} не содержит шаблон самоинициализации`);
      return false;
    }
    
    //console.log(`Обработка файла: ${filePath}`);
    
    // Заменяем шаблон самоинициализации
    const updatedContent = content.replace(selfInitRegex, replacementText);
    
    // Записываем обновленное содержимое
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Файл ${filePath} успешно обновлен`);
    return true;
  } catch (error) {
    console.error(`Ошибка при обработке файла ${filePath}:`, error);
    return false;
  }
}

// Функция для обработки всех файлов моделей
function processAllModels() {
  // Получаем список файлов в директории
  const files = fs.readdirSync(modelsDir);
  
  // Счетчики
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  // Обрабатываем каждый файл с расширением .js
  for (const file of files) {
    if (file.endsWith('.js') && 
        file !== 'index.js' && 
        file !== 'fix-models.js' && 
        file !== 'remove-self-init.js' &&
        file !== 'initializeModels.js') {
      totalProcessed++;
      const filePath = path.join(modelsDir, file);
      try {
        const updated = processModelFile(filePath);
        if (updated) totalUpdated++;
      } catch (error) {
        console.error(`Ошибка при обработке ${file}:`, error);
        totalErrors++;
      }
    }
  }
  
  console.log(`\n--- Итоги обработки ---`);
  console.log(`Всего обработано файлов: ${totalProcessed}`);
  console.log(`Успешно обновлено: ${totalUpdated}`);
  console.log(`Ошибок: ${totalErrors}`);
}

// Запускаем обработку
console.log('Начало обработки моделей...');
processAllModels();
console.log('Обработка завершена');