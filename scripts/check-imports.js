/**
 * Скрипт для проверки импортов серверных модулей в клиентском коде
 * Помогает выявить прямые импорты модулей pg, sequelize и других нативных модулей Node.js
 */

const fs = require('fs');
const path = require('path');

// Проблемные модули, которые не должны импортироваться напрямую в клиентском коде
const PROBLEMATIC_MODULES = [
  'pg',
  'pg-native',
  'sequelize',
  'dns',
  'net',
  'tls',
  'cloudflare:sockets',
  'fs',
  'child_process'
];

// Регулярное выражение для поиска импортов
const IMPORT_REGEX = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
const REQUIRE_REGEX = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// Исключаемые каталоги и файлы
const EXCLUDED_PATHS = [
  /node_modules/,
  /\.git/,
  /\.vscode/,
  /build/,
  /scripts/,
  /server/,
  /monolith/
];

// Функция для проверки импортов в файле
function checkImportsInFile(filePath) {
  // Проверяем расширение файла
  const ext = path.extname(filePath);
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    return [];
  }

  // Проверяем, не нужно ли исключить файл
  if (EXCLUDED_PATHS.some(pattern => pattern.test(filePath))) {
    return [];
  }

  // Читаем содержимое файла
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Проверяем наличие проблемных импортов
  const problematicImports = [];
  
  // Проверка импортов ES6
  let match;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const importPath = match[1];
    
    if (PROBLEMATIC_MODULES.some(module => 
        importPath === module || importPath.startsWith(module + '/'))) {
      problematicImports.push({
        type: 'import',
        module: importPath,
        position: match.index
      });
    }
  }
  
  // Проверка require CommonJS
  REQUIRE_REGEX.lastIndex = 0;
  while ((match = REQUIRE_REGEX.exec(content)) !== null) {
    const importPath = match[1];
    
    if (PROBLEMATIC_MODULES.some(module => 
        importPath === module || importPath.startsWith(module + '/'))) {
      problematicImports.push({
        type: 'require',
        module: importPath,
        position: match.index
      });
    }
  }
  
  return problematicImports.length > 0 ? { 
    file: filePath,
    imports: problematicImports
  } : [];
}

// Рекурсивная функция для проверки каталога
function checkDirectory(dirPath, results = []) {
  // Проверяем, не нужно ли исключить каталог
  if (EXCLUDED_PATHS.some(pattern => pattern.test(dirPath))) {
    return results;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Рекурсивно проверяем подкаталог
      checkDirectory(itemPath, results);
    } else if (stats.isFile()) {
      // Проверяем файл
      const fileResults = checkImportsInFile(itemPath);
      if (fileResults.length > 0) {
        results.push(fileResults);
      }
    }
  }
  
  return results;
}

// Основная функция
function main() {
  console.log('Проверка прямых импортов серверных модулей в клиентском коде...');
  
  // Проверяем исходный код клиента (предполагается, что клиентский код находится в директории src)
  const clientDir = path.join(__dirname, '../src');
  const results = checkDirectory(clientDir);
  
  if (results.length === 0) {
    console.log('Проблемных импортов не обнаружено.');
    return;
  }
  
  console.log('Обнаружены проблемные импорты:');
  
  for (const result of results) {
    console.log(`Файл: ${result.file}`);
    
    for (const importInfo of result.imports) {
      console.log(`  - ${importInfo.type} '${importInfo.module}' (позиция: ${importInfo.position})`);
    }
    
    console.log('');
  }
  
  console.log('Эти импорты могут вызывать проблемы с компиляцией в браузере.');
  console.log('Рекомендуется использовать адаптеры вместо прямых импортов серверных модулей.');
}

main();