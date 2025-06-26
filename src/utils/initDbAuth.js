/**
 * Утилита для инициализации и проверки базы данных авторизации
 * Выполняет проверку соединения и структуры таблиц
 */
import { unifiedDatabase } from '../services/database-connection-manager';
import { getInitializedUserModel } from '../models/user';

/**
 * Проверка соединения с базой данных
 */
async function checkDbConnection() {
  try {
    const { db } = await unifiedDatabase.getSequelizeInstance();
    await db.authenticate();
    console.log('✅ Соединение с базой данных успешно установлено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка соединения с базой данных:', error.message);
    return false;
  }
}

/**
 * Проверка наличия и структуры таблицы пользователей
 */
async function checkUserTable() {
  try {
    const UserModel = await getInitializedUserModel();
    const user = await UserModel.findOne();
    console.log('✅ Таблица users существует и доступна');
    return true;
  } catch (error) {
    console.error('❌ Проблема с таблицей users:', error.message);
    return false;
  }
}

/**
 * Проверка правильности миграции модели User
 */
async function checkUserModel() {
  try {
    // Проверяем наличие нужных полей в модели
    const requiredFields = ['username', 'email', 'passwordHash', 'cultivationLevel', 'experience'];
    
    // Получаем описание модели
    const { db } = await unifiedDatabase.getSequelizeInstance();
    const userModel = db.models.User;
    
    if (!userModel) {
      console.error('❌ Модель User не найдена');
      return false;
    }
    
    // Проверяем наличие обязательных полей
    const missingFields = [];
    for (const field of requiredFields) {
      if (!userModel.rawAttributes[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.error(`❌ В модели User отсутствуют поля: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log('✅ Структура модели User корректна');
    return true;
  } catch (error) {
    console.error('❌ Ошибка проверки модели User:', error.message);
    return false;
  }
}

/**
 * Запуск всех проверок
 */
async function runAllChecks() {
  console.log('🔍 Начало проверки базы данных авторизации...');
  
  const connectionOk = await checkDbConnection();
  if (!connectionOk) {
    console.error('❌ Проверка прервана из-за ошибки подключения к базе данных');
    return false;
  }
  
  const tableOk = await checkUserTable();
  const modelOk = await checkUserModel();
  
  if (connectionOk && tableOk && modelOk) {
    console.log('✅ Все проверки пройдены успешно. База данных готова к работе с авторизацией');
    return true;
  } else {
    console.log('❌ Некоторые проверки не пройдены, требуется дополнительная настройка');
    return false;
  }
}

// При загрузке в браузере, экспортируем функцию в глобальную область видимости
if (typeof window !== 'undefined') {
  window.checkAuthDatabase = runAllChecks;
  console.log('Функция checkAuthDatabase доступна в консоли.');
  console.log('Для проверки базы данных вызовите: checkAuthDatabase()');
}

export {
  checkDbConnection,
  checkUserTable,
  checkUserModel,
  runAllChecks
};