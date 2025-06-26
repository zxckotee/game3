/**
 * Скрипт для исправления проблем с моделями и ассоциациями
 * Обеспечивает правильную инициализацию моделей и установку ассоциаций
 */

const path = require('path');
const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');
const { unifiedDatabase } = require('../src/services/database-connection-manager-adapter');

// Настройка логирования
const LOG_FILE = path.join(__dirname, 'repair-models-log.txt');
let logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

function log(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(formattedMessage);
    logStream.write(formattedMessage + '\n');
}

async function main() {
    try {
        log('Запуск скрипта исправления моделей и ассоциаций...');
        
        // Получаем экземпляр Sequelize
        log('Получение экземпляра Sequelize...');
        const { db } = await unifiedDatabase.getSequelizeInstance();
        const sequelize = db;
        
        if (!sequelize) {
            throw new Error('Не удалось получить экземпляр Sequelize');
        }
        
        log('Экземпляр Sequelize успешно получен');
        
        // Путь к директории с моделями
        const modelsDir = path.join(__dirname, '../src/models');
        log(`Сканирование директории моделей: ${modelsDir}`);
        
        // Получаем список файлов моделей
        const modelFiles = fs
            .readdirSync(modelsDir)
            .filter(file => 
                file.endsWith('.js') && 
                !file.includes('-adapter') &&
                !file.includes('index') &&
                !file.includes('client-')
            );
        
        log(`Найдено ${modelFiles.length} файлов моделей для обработки`);
        
        // Контейнер для инициализированных моделей
        const models = {};
        
        // Шаг 1: Загружаем все модели
        log('Шаг 1: Загрузка моделей...');
        for (const file of modelFiles) {
            try {
                const modelPath = path.join(modelsDir, file);
                log(`Загрузка модели из: ${file}`);
                
                // Удаляем кэш модуля, чтобы он точно перезагрузился
                delete require.cache[require.resolve(modelPath)];
                
                // Загружаем модель
                const model = require(modelPath);
                
                if (model && model.name) {
                    models[model.name] = model;
                    log(`Модель ${model.name} успешно загружена`);
                } else {
                    log(`Предупреждение: Файл ${file} не экспортирует модель с именем`);
                }
            } catch (error) {
                log(`Ошибка при загрузке модели из ${file}: ${error.message}`);
            }
        }
        
        // Шаг 2: Инициализируем модели, которые не были инициализированы
        log('Шаг 2: Инициализация моделей...');
        for (const modelName in models) {
            const model = models[modelName];
            
            try {
                // Проверяем, была ли модель уже инициализирована
                if (typeof model.init === 'function' && model.prototype instanceof Sequelize.Model) {
                    log(`Модель ${modelName} уже инициализирована`);
                } else if (typeof model.init === 'function') {
                    log(`Инициализация модели ${modelName}...`);
                    
                    if (typeof model.init === 'function') {
                        // Если у модели есть асинхронный метод init
                        if (model.init.constructor.name === 'AsyncFunction') {
                            await model.init();
                            log(`Модель ${modelName} успешно инициализирована (async)`);
                        } else {
                            // Если метод синхронный
                            model.init({}, { sequelize, modelName });
                            log(`Модель ${modelName} успешно инициализирована (sync)`);
                        }
                    }
                } else {
                    log(`Предупреждение: Модель ${modelName} не имеет метода init`);
                }
            } catch (error) {
                log(`Ошибка при инициализации модели ${modelName}: ${error.message}`);
            }
        }
        
        // Шаг 3: Устанавливаем ассоциации между моделями
        log('Шаг 3: Установка ассоциаций между моделями...');
        for (const modelName in models) {
            const model = models[modelName];
            
            try {
                if (typeof model.associate === 'function') {
                    log(`Установка ассоциаций для модели ${modelName}...`);
                    model.associate(models);
                    log(`Ассоциации для ${modelName} успешно установлены`);
                } else {
                    log(`Модель ${modelName} не имеет метода associate`);
                }
            } catch (error) {
                log(`Ошибка при установке ассоциаций для модели ${modelName}: ${error.message}`);
            }
        }
        
        // Шаг 4: Синхронизация моделей с базой данных
        log('Шаг 4: Синхронизация моделей с базой данных...');
        try {
            // Проверка соединения
            await sequelize.authenticate();
            log('Соединение с базой данных установлено');
            
            // Синхронизация без удаления таблиц
            await sequelize.sync({ alter: false });
            log('Модели успешно синхронизированы с базой данных');
        } catch (error) {
            log(`Ошибка при синхронизации моделей: ${error.message}`);
        }
        
        log('Скрипт исправления моделей завершил работу успешно');
    } catch (error) {
        log(`Критическая ошибка: ${error.message}`);
        log(error.stack);
    } finally {
        // Закрываем файл журнала
        logStream.end();
    }
}

// Выполняем скрипт
main().catch(error => {
    console.error('Необработанная ошибка:', error);
    logStream.write(`[${new Date().toISOString()}] Необработанная ошибка: ${error.message}\n`);
    logStream.write(`[${new Date().toISOString()}] ${error.stack}\n`);
    logStream.end();
});