const fs = require('fs');
const path = require('path');

// Директория с файлами сервисов
const servicesDirectory = path.join(__dirname, '../src/services');

// Функция для преобразования файла из ES Modules в CommonJS
function convertFile(filePath) {
  console.log(`Преобразование файла: ${filePath}`);
  
  // Читаем содержимое файла
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Проверяем, содержит ли файл импорты ES Modules
  if (!content.includes('import ') && !content.includes('export ')) {
    console.log(`Файл уже в формате CommonJS: ${filePath}`);
    return;
  }
  
  // Заменяем импорты
  content = content.replace(/import\s+(\w+)\s+from\s+['"](.+)['"]/g, 'const $1 = require(\'$2\')');
  content = content.replace(/import\s*\*\s*as\s+(\w+)\s+from\s+['"](.+)['"]/g, 'const $1 = require(\'$2\')');
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](.+)['"]/g, (match, imports, modulePath) => {
    const importNames = imports.split(',').map(i => i.trim());
    return `const { ${importNames.join(', ')} } = require('${modulePath}')`;
  });
  
  // Собираем все именованные функции и константы для экспорта
  const namedExports = new Set();
  
  // Находим все именованные экспорты функций
  const functionExportsMatches = content.matchAll(/export\s+(async\s+)?function\s+(\w+)/g);
  for (const match of functionExportsMatches) {
    namedExports.add(match[2]);
    content = content.replace(match[0], `${match[1] || ''}function ${match[2]}`);
  }
  
  // Находим все именованные экспорты констант
  const constExportsMatches = content.matchAll(/export\s+(const|let|var)\s+(\w+)/g);
  for (const match of constExportsMatches) {
    namedExports.add(match[2]);
    content = content.replace(match[0], `${match[1]} ${match[2]}`);
  }
  
  // Проверяем наличие класса в файле
  const classMatch = content.match(/class\s+(\w+)/);
  let className = '';
  if (classMatch) {
    className = classMatch[1];
  }
  
  // Проверяем экспорт по умолчанию
  let hasDefaultExport = false;
  let defaultExportName = '';
  
  // Находим все варианты export default
  const exportDefaultMatch = content.match(/export\s+default\s+(\w+)\s*;?/);
  const exportDefaultObjectMatch = content.match(/export\s+default\s+{([^}]+)}/);
  
  if (exportDefaultMatch) {
    // Простой export default имя;
    defaultExportName = exportDefaultMatch[1];
    hasDefaultExport = true;
    content = content.replace(/export\s+default\s+\w+\s*;?/, `module.exports = ${defaultExportName};`);
  } else if (exportDefaultObjectMatch) {
    // Экспорт объекта export default { ... }
    const exportedItems = exportDefaultObjectMatch[1].split(',').map(item => item.trim());
    hasDefaultExport = true;
    
    // Заменяем export default { ... } на module.exports = { ... }
    content = content.replace(/export\s+default\s+{([^}]+)}/, `module.exports = {\n  ${exportedItems.join(',\n  ')}\n}`);
    
    // Добавляем отдельные экспорты для каждого свойства объекта
    content += '\n\n// Экспортируем отдельные свойства для совместимости';
    for (const item of exportedItems) {
      const name = item.split(':')[0].trim();
      content += `\nmodule.exports.${name} = ${name};`;
    }
  }
  
  // Если есть именованные экспорты, добавляем их в module.exports
  if (namedExports.size > 0 && !hasDefaultExport) {
    content += '\n\n// Экспортируем функции и константы';
    content += `\nmodule.exports = {\n  ${Array.from(namedExports).join(',\n  ')}\n};`;
    
    // Добавляем отдельные экспорты для каждой функции или константы
    content += '\n\n// Экспортируем отдельные свойства для совместимости';
    for (const name of namedExports) {
      content += `\nmodule.exports.${name} = ${name};`;
    }
  }
  
  // Если есть класс и экспорт по умолчанию, добавляем экспорты для статических методов
  if (className && hasDefaultExport && className === defaultExportName) {
    // Ищем статические методы класса
    const staticMethodsRegex = new RegExp(`static\\s+(async\\s+)?([\\w]+)\\s*\\(`, 'g');
    const staticMethods = new Set();
    
    let match;
    while ((match = staticMethodsRegex.exec(content)) !== null) {
      staticMethods.add(match[2]);
    }
    
    // Если есть статические методы, добавляем их экспорт
    if (staticMethods.size > 0) {
      content += '\n\n// Экспортируем отдельные методы для совместимости';
      for (const method of staticMethods) {
        content += `\nmodule.exports.${method} = ${className}.${method};`;
      }
    }
  }
  
  // Записываем измененное содержимое обратно в файл
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Файл успешно преобразован: ${filePath}`);
}

// Получаем список всех JavaScript файлов (кроме .cjs)
const jsFiles = fs.readdirSync(servicesDirectory)
  .filter(file => file.endsWith('.js') && !file.endsWith('.cjs'));

// Преобразуем каждый файл
let convertedCount = 0;
for (const file of jsFiles) {
  const filePath = path.join(servicesDirectory, file);
  convertFile(filePath);
  convertedCount++;
}

console.log(`Преобразовано файлов: ${convertedCount}`);