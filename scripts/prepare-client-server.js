/**
 * Скрипт для подготовки проекта к клиент-серверной архитектуре
 * 
 * Создает структуру каталогов, переносит файлы в соответствующие директории
 * и настраивает package.json для клиентской и серверной частей
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('Подготовка проекта к клиент-серверной архитектуре...');

// Корневая директория проекта
const rootDir = path.join(__dirname, '..');

// Создаем директории для клиентской и серверной части
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');

// Создаем директории, если они не существуют
fs.ensureDirSync(clientDir);
fs.ensureDirSync(serverDir);
fs.ensureDirSync(path.join(clientDir, 'src'));
fs.ensureDirSync(path.join(serverDir, 'src'));

// Создаем структуру каталогов для серверной части
fs.ensureDirSync(path.join(serverDir, 'src', 'api'));
fs.ensureDirSync(path.join(serverDir, 'src', 'models'));
fs.ensureDirSync(path.join(serverDir, 'src', 'services'));
fs.ensureDirSync(path.join(serverDir, 'src', 'config'));
fs.ensureDirSync(path.join(serverDir, 'src', 'middleware'));

// Создаем структуру каталогов для клиентской части
fs.ensureDirSync(path.join(clientDir, 'src', 'services'));
fs.ensureDirSync(path.join(clientDir, 'src', 'components'));
fs.ensureDirSync(path.join(clientDir, 'public'));

// Функция для копирования файлов с сохранением относительных путей
function copyFilesToDir(sourceDir, destDir, filterFunction) {
  try {
    fs.copySync(sourceDir, destDir, {
      filter: (src, dest) => {
        const relativePath = path.relative(sourceDir, src);
        if (filterFunction && !filterFunction(relativePath)) {
          return false;
        }
        console.log(`Копирование ${relativePath} в ${destDir}`);
        return true;
      }
    });
  } catch (err) {
    console.error(`Ошибка при копировании из ${sourceDir} в ${destDir}:`, err);
  }
}

// Копирование серверных файлов
console.log('Копирование серверных файлов...');
const serverFileFilter = (relativePath) => {
  // Исключаем клиентские файлы и директории
  const excludedPatterns = [
    /^public/,
    /^client/,
    /^node_modules/,
    /^\.git/,
    /^build/,
    /\.client\./,
    /client-api\.js$/,
    /\.jsx$/,
    /\.tsx?$/
  ];
  
  // Включаем только серверные файлы
  const includedPatterns = [
    /^src\/models/,
    /^src\/services/,
    /^src\/config/,
    /^src\/server\.js$/,
    /^src\/sequelize-config\.js$/,
    /\.server\./
  ];
  
  // Проверяем на исключения
  if (excludedPatterns.some(pattern => pattern.test(relativePath))) {
    return false;
  }
  
  // Проверяем на включения
  return includedPatterns.some(pattern => pattern.test(relativePath));
};

copyFilesToDir(
  path.join(rootDir, 'src'), 
  path.join(serverDir, 'src'),
  serverFileFilter
);

// Копирование конфигурационных файлов для серверной части
fs.copySync(
  path.join(rootDir, 'src', 'config', 'database.json'),
  path.join(serverDir, 'src', 'config', 'database.json')
);

// Копирование клиентских файлов
console.log('Копирование клиентских файлов...');
const clientFileFilter = (relativePath) => {
  // Исключаем серверные файлы и директории
  const excludedPatterns = [
    /^server/,
    /^node_modules/,
    /^\.git/,
    /\.server\./,
    /^src\/models/,
    /server\.js$/,
    /database-connection-manager\.js$/
  ];
  
  // Включаем только клиентские файлы
  const includedPatterns = [
    /^src\/components/,
    /^src\/contexts?/,
    /^src\/hooks/,
    /^src\/pages/,
    /^src\/utils/,
    /^src\/App\./,
    /^src\/index\./,
    /\.client\./,
    /client-api\.js$/,
    /\.jsx$/,
    /\.tsx?$/,
    /\.css$/
  ];
  
  // Проверяем на исключения
  if (excludedPatterns.some(pattern => pattern.test(relativePath))) {
    return false;
  }
  
  // Проверяем на включения для конкретных файлов и директорий
  if (includedPatterns.some(pattern => pattern.test(relativePath))) {
    return true;
  }
  
  // По умолчанию не включаем
  return false;
};

copyFilesToDir(
  path.join(rootDir, 'src'),
  path.join(clientDir, 'src'),
  clientFileFilter
);

// Копирование public директории для клиента
if (fs.existsSync(path.join(rootDir, 'public'))) {
  copyFilesToDir(
    path.join(rootDir, 'public'),
    path.join(clientDir, 'public')
  );
}

// Создание package.json для серверной части
const serverPackageJson = {
  name: "immortal-path-server",
  version: "1.0.0",
  description: "Серверная часть приложения 'Путь к Бессмертию'",
  main: "src/server.js",
  scripts: {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "migrate": "sequelize-cli db:migrate"
  },
  dependencies: {
    "express": "^4.17.1",
    "cors": "^2.8.5",
    "body-parser": "^1.19.0",
    "jsonwebtoken": "^8.5.1",
    "sequelize": "^6.6.5",
    "pg": "^8.7.1",
    "bcryptjs": "^2.4.3",
    "dotenv": "^10.0.0"
  },
  devDependencies: {
    "nodemon": "^2.0.12",
    "sequelize-cli": "^6.3.0"
  }
};

// Создание package.json для клиентской части
const clientPackageJson = {
  name: "immortal-path-client",
  version: "1.0.0",
  description: "Клиентская часть приложения 'Путь к Бессмертию'",
  scripts: {
    "start": "craco start",
    "build": "craco build"
  },
  dependencies: {
    "@craco/craco": "^7.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "react-scripts": "^5.0.1",
    "styled-components": "^5.3.9"
  },
  devDependencies: {
    "assert": "^2.0.0",
    "buffer": "^6.0.3",
    "crypto-browserify": "^3.12.0",
    "path-browserify": "^1.0.1",
    "process": "^0.11.10",
    "stream-browserify": "^3.0.0",
    "url": "^0.11.0",
    "util": "^0.12.5",
    "vm-browserify": "^1.1.2"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:3001"
};

// Запись package.json файлов
fs.writeFileSync(
  path.join(serverDir, 'package.json'),
  JSON.stringify(serverPackageJson, null, 2)
);

fs.writeFileSync(
  path.join(clientDir, 'package.json'),
  JSON.stringify(clientPackageJson, null, 2)
);

// Копирование craco.config.js для клиентской части
if (fs.existsSync(path.join(rootDir, 'craco.config.js'))) {
  fs.copySync(
    path.join(rootDir, 'craco.config.js'),
    path.join(clientDir, 'craco.config.js')
  );
}

// Создание файла .env для клиентской части
fs.writeFileSync(
  path.join(clientDir, '.env'),
  'REACT_APP_API_URL=http://localhost:3001/api\n'
);

// Создание корневого package.json для удобства работы с проектом
const rootPackageJson = {
  name: "immortal-path",
  version: "1.0.0",
  description: "Путь к Бессмертию - Культивационная игра",
  scripts: {
    "install:all": "npm install && cd server && npm install && cd ../client && npm install",
    "start:server": "cd server && npm run dev",
    "start:client": "cd client && npm start",
    "dev": "concurrently \"npm run start:server\" \"npm run start:client\"",
    "build:client": "cd client && npm run build",
    "migrate": "cd server && npm run migrate"
  },
  devDependencies: {
    "concurrently": "^8.2.2"
  }
};

// Сохраняем старый package.json для резервной копии
if (fs.existsSync(path.join(rootDir, 'package.json'))) {
  fs.copySync(
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'package.json.bak')
  );
}

// Обновляем корневой package.json
fs.writeFileSync(
  path.join(rootDir, 'package.json'),
  JSON.stringify(rootPackageJson, null, 2)
);

console.log('Подготовка проекта к клиент-серверной архитектуре завершена!');
console.log('');
console.log('Для запуска проекта в режиме разработки выполните:');
console.log('  npm run install:all  # Установка всех зависимостей');
console.log('  npm run dev          # Запуск клиента и сервера');
console.log('');
console.log('Для запуска только сервера:');
console.log('  npm run start:server');
console.log('');
console.log('Для запуска только клиента:');
console.log('  npm run start:client');