/**
 * Скрипт для исправления моделей и их инициализации
 * Запускается: node src/models/fix-models.js
 */
const fs = require('fs');
const path = require('path');

// Путь к директории моделей
const modelsDir = path.join(__dirname);

// Шаблон для замены
const importTemplate = `const { Model, DataTypes } = require('../services/database');
const { unifiedDatabase } = require('../services/database-connection-manager');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await unifiedDatabase.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}`;

const initTemplate = (className) => `${className}.init = async function() {
  const sequelize = await getSequelize();
  
  // Исправлено: Используем Model.init.call(this, ...) вместо super.init(...)
  return Model.init.call(this, `;

const closingTemplate = (className) => `  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await ${className}.init();
    console.log('${className} модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели ${className}:', error);
    console.error(error.stack);
  }
})();`;

// Функция для обработки файла модели
function processModelFile(filePath) {
  try {
    // Читаем содержимое файла
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, содержит ли файл старый импорт sequelize
    if (!content.includes("const { Model, DataTypes, sequelize }") && 
        !content.includes("import { Model, DataTypes, sequelize }")) {
      console.log(`Файл ${filePath} не требует обновления`);
      return false;
    }
    
    //console.log(`Обработка файла: ${filePath}`);
    
    // Заменяем старый импорт на новый
    let updatedContent = content.replace(
      /const \{ Model, DataTypes, sequelize \} = require\(['"']\.\.\/services\/database['"']\);/g, 
      importTemplate
    );
    updatedContent = updatedContent.replace(
      /import \{ Model, DataTypes, sequelize \} from ['"']\.\.\/services\/database['"'];/g, 
      importTemplate
    );
    
    // Находим имя класса
    const classNameMatch = updatedContent.match(/class (\w+) extends Model/);
    if (!classNameMatch) {
      console.error(`Не удалось найти имя класса в файле ${filePath}`);
      return false;
    }
    
    const className = classNameMatch[1];
    console.log(`Найден класс: ${className}`);
    
    // Заменяем вызов init
    updatedContent = updatedContent.replace(
      new RegExp(`${className}\\.init\\(\\{`), 
      `${initTemplate(className)}{`
    );
    
    // Заменяем закрывающую часть init
    updatedContent = updatedContent.replace(
      /\}, \{\s*sequelize,\s*modelName: ['"](\w+)['"],\s*tableName: ['"](\w+)['"]\s*\}\);/g, 
      (match, modelName, tableName) => {
        return `  }, {
    sequelize,
    modelName: '${modelName}',
    tableName: '${tableName}'
  ${closingTemplate(className)}`;
      }
    );
    
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
    if (file.endsWith('.js') && file !== 'index.js' && file !== 'fix-models.js') {
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
