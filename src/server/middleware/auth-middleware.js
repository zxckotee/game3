/**
 * Middleware для аутентификации и авторизации
 * Проверяет права доступа пользователей к защищенным маршрутам на основе токенов в базе данных
 */
const { Sequelize } = require('sequelize');
const { unifiedDatabase, initializeDatabaseConnection} = require('../../services/database-connection-manager');

let sequelize;

// Асинхронная функция для получения экземпляра
async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  }
  return sequelize;
}

/**
 * Middleware для проверки аутентификации пользователя
 * @param {Object} req - Запрос Express
 * @param {Object} res - Ответ Express
 * @param {Function} next - Функция следующего middleware
 */
exports.validateAuth = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Требуется аутентификация' });
    }

    // Извлекаем токен
    const token = authHeader.split(' ')[1];
    
    try {
      // Получаем экземпляр sequelize
      const sequelizeDb = await getSequelizeInstance();
      
      // Проверяем токен в базе данных
      const users = await sequelizeDb.query(
        'SELECT id, username, role FROM users WHERE auth_token = :token AND token_expires_at > NOW()',
        {
          replacements: { token },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      if (!users || users.length === 0) {
        console.warn('Недействительный или истекший токен:', token);
        return res.status(401).json({ message: 'Недействительный или истекший токен' });
      }
      
      const user = users[0];
      
      // Добавляем данные пользователя в req
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role || 'user'
      };
      
      console.log(`[Auth] Пользователь ${user.username} (ID: ${user.id}) успешно аутентифицирован`);
      
      // Продолжаем выполнение запроса
      next();
    } catch (err) {
      console.error('Ошибка при проверке токена:', err);
      return res.status(401).json({ message: 'Ошибка аутентификации' });
    }
  } catch (error) {
    console.error('Ошибка в middleware аутентификации:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

/**
 * Middleware для проверки прав администратора
 * @param {Object} req - Запрос Express
 * @param {Object} res - Ответ Express
 * @param {Function} next - Функция следующего middleware
 */
exports.validateAdmin = async (req, res, next) => {
  try {
    // Сначала проверяем аутентификацию
    exports.validateAuth(req, res, async () => {
      // Если пользователь аутентифицирован, проверяем его роль
      try {
        if (!req.user || !req.user.role) {
          return res.status(403).json({ message: 'Отсутствуют данные о роли пользователя' });
        }
        
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
        }
        
        // Если пользователь админ, продолжаем выполнение запроса
        next();
      } catch (error) {
        console.error('Ошибка при проверке прав администратора:', error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    });
  } catch (error) {
    console.error('Ошибка в middleware администратора:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

/**
 * Функция для очистки истекших токенов
 * Рекомендуется запускать периодически для поддержания чистоты базы данных
 */
exports.cleanupExpiredTokens = async () => {
  try {
    const sequelizeDb = await getSequelizeInstance();
    
    // Очищаем истекшие токены
    const result = await sequelizeDb.query(
      'UPDATE users SET auth_token = NULL, token_expires_at = NULL WHERE token_expires_at < NOW()',
      {
        type: Sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log(`Очищено ${result[1]} истекших токенов`);
    return result[1]; // Возвращаем количество обновленных записей
  } catch (error) {
    console.error('Ошибка при очистке истекших токенов:', error);
    throw error;
  }
};