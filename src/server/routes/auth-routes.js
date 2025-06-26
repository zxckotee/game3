/**
 * Маршруты API для аутентификации пользователей
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { unifiedDatabase, initializeDatabaseConnection } = require('../../services/database-connection-manager');
let sequelize; const { Sequelize } = require('sequelize');


async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  }
  return sequelize;
}

/**
 * @route POST /api/auth/register
 * @desc Регистрация нового пользователя
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Необходимо указать имя пользователя, email и пароль' });
    }
    
    // Получаем экземпляр sequelize
    const sequelizeDb = await getSequelizeInstance();
    
    // Проверка, существует ли пользователь
    const existingUsers = await sequelizeDb.query(
      'SELECT * FROM users WHERE username = :username OR email = :email',
      {
        replacements: { username, email },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }
    
    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Генерация токена аутентификации
    const authToken = crypto.randomBytes(32).toString('hex');
    
    // Устанавливаем срок действия токена (7 дней)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);
    
    // Создание нового пользователя с токеном
    const result = await sequelizeDb.query(
      `INSERT INTO users
       (username, email, password_hash, auth_token, token_expires_at, cultivation_level, experience, role, created_at, updated_at)
       VALUES (:username, :email, :passwordHash, :authToken, :tokenExpiresAt, 1, 0, 'user', NOW(), NOW())
       RETURNING id, username, email, auth_token, cultivation_level, experience, role`,
      {
        replacements: { 
          username, 
          email, 
          passwordHash, 
          authToken, 
          tokenExpiresAt 
        },
        type: Sequelize.QueryTypes.INSERT
      }
    );
    
    const user = result[0][0];
    
    // Возвращаем данные пользователя с токеном
    res.status(201).json({
      ...user,
      // Переименовываем поле auth_token в authToken для совместимости с клиентом
      authToken: user.auth_token,
      auth_token: undefined
    });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Авторизация пользователя
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Необходимо указать имя пользователя/email и пароль' });
    }
    
    // Получаем экземпляр sequelize
    const sequelizeDb = await getSequelizeInstance();
    
    // Поиск пользователя
    const users = await sequelizeDb.query(
      'SELECT * FROM users WHERE username = :usernameOrEmail OR email = :usernameOrEmail',
      {
        replacements: { usernameOrEmail },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    
    const user = users[0];
    
    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    
    // Генерация токена аутентификации
    const authToken = crypto.randomBytes(32).toString('hex');
    
    // Устанавливаем срок действия токена (7 дней)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);
    
    // Обновляем время последнего входа и сохраняем токен
    await sequelizeDb.query(
      'UPDATE users SET auth_token = :authToken, token_expires_at = :tokenExpiresAt, last_login = NOW(), updated_at = NOW() WHERE id = :id',
      {
        replacements: { 
          id: user.id, 
          authToken, 
          tokenExpiresAt 
        },
        type: Sequelize.QueryTypes.UPDATE
      }
    );
    
    // Отправляем данные пользователя без хеша пароля
    const { password_hash, ...userData } = user;
    res.json({
      ...userData,
      authToken // Добавляем токен в ответ
    });
  } catch (error) {
    console.error('Ошибка при входе пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Выход из системы
 * @access Private
 */
router.post('/logout', async (req, res) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    // Извлекаем токен
    const token = authHeader.split(' ')[1];
    
    // Получаем экземпляр sequelize
    const sequelizeDb = await getSequelizeInstance();
    
    // Инвалидируем токен в базе данных
    const result = await sequelizeDb.query(
      'UPDATE users SET auth_token = NULL, token_expires_at = NULL, updated_at = NOW() WHERE auth_token = :token RETURNING id, username',
      {
        replacements: { token },
        type: Sequelize.QueryTypes.UPDATE
      }
    );
    
    // Проверяем, был ли найден пользователь с таким токеном
    if (result[0].length === 0) {
      console.warn('Попытка выхода с недействительным токеном:', token);
      return res.status(401).json({ 
        success: false,
        error: 'Недействительный токен' 
      });
    }
    
    const user = result[0][0];
    console.log(`Пользователь ${user.username} (ID: ${user.id}) вышел из системы`);
    
    res.json({ 
      success: true, 
      message: 'Выход выполнен успешно' 
    });
  } catch (error) {
    console.error('Ошибка при выходе из системы:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

module.exports = router;