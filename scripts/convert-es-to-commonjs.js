const fs = require('fs');
const path = require('path');

// Директория с файлами API
const apiDirectory = path.join(__dirname, '../src/services');

// Функция для преобразования файла из ES Modules в CommonJS
function convertFile(filePath) {
  console.log(`Преобразование файла: ${filePath}`);
  
  // Читаем содержимое файла
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Заменяем импорты
  content = content.replace(/import\s+(\w+)\s+from\s+['"](.+)['"]/g, 'const $1 = require(\'$2\')');
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](.+)['"]/g, (match, imports, modulePath) => {
    const importNames = imports.split(',').map(i => i.trim());
    return `const { ${importNames.join(', ')} } = require('${modulePath}')`;
  });
  
  // Заменяем export default
  let hasDefaultExport = false;
  let defaultExportName = '';
  
  // Проверяем наличие класса в файле
  const classMatch = content.match(/class\s+(\w+)/);
  const exportDefaultMatch = content.match(/export\s+default\s+(\w+)/);
  
  if (classMatch && exportDefaultMatch) {
    // Это класс, который экспортируется
    const className = classMatch[1];
    defaultExportName = className;
    hasDefaultExport = true;
    
    // Заменяем export default на module.exports
    content = content.replace(/export\s+default\s+\w+\s*;?/, `// Экспортируем класс через CommonJS\nmodule.exports = ${className};`);
    
    // Ищем статические методы класса
    const staticMethodsRegex = new RegExp(`static\\s+async\\s+(\\w+)\\s*\\(`, 'g');
    const staticMethods = [];
    
    let match;
    while ((match = staticMethodsRegex.exec(content)) !== null) {
      staticMethods.push(match[1]);
    }
    
    // Если есть статические методы, добавляем их экспорт
    if (staticMethods.length > 0) {
      content += '\n\n// Экспортируем отдельные методы для совместимости';
      for (const method of staticMethods) {
        content += `\nmodule.exports.${method} = ${className}.${method};`;
      }
    }
  } else if (exportDefaultMatch) {
    // Обычный export default
    defaultExportName = exportDefaultMatch[1];
    hasDefaultExport = true;
    content = content.replace(/export\s+default\s+\w+\s*;?/, `module.exports = ${defaultExportName};`);
  }
  
  // Заменяем именованные экспорты функций
  content = content.replace(/export\s+async\s+function\s+(\w+)/g, 'async function $1');
  content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
  
  // Заменяем именованные экспорты констант
  content = content.replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 =');
  
  // Находим все именованные экспорты
  const namedExportsRegex = /export\s+(const|let|var|function|async function)\s+(\w+)/g;
  const namedExports = [];
  
  let namedMatch;
  while ((namedMatch = namedExportsRegex.exec(content)) !== null) {
    namedExports.push(namedMatch[2]);
  }
  
  // Если есть именованные экспорты, добавляем их в module.exports
  if (namedExports.length > 0 && !hasDefaultExport) {
    content += '\n\n// Экспортируем функции и константы';
    content += `\nmodule.exports = {\n  ${namedExports.join(',\n  ')}\n};`;
    
    // Добавляем отдельные экспорты для каждой функции или константы
    content += '\n\n// Экспортируем отдельные свойства для совместимости';
    for (const name of namedExports) {
      content += `\nmodule.exports.${name} = ${name};`;
    }
  }
  
  // Записываем измененное содержимое обратно в файл
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Файл успешно преобразован: ${filePath}`);
}

// Получаем список API-файлов
const apiFiles = fs.readdirSync(apiDirectory)
  .filter(file => file.endsWith('-api.js') && !file.includes('.cjs'));

// Преобразуем каждый файл
for (const file of apiFiles) {
  const filePath = path.join(apiDirectory, file);
  convertFile(filePath);
}

console.log(`Преобразовано файлов: ${apiFiles.length}`);