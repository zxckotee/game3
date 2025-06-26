const { hashPassword, comparePassword } = require('./web-crypto-hash');
const userModule = require('../models/user');
const User = userModule.default || userModule;
const { getInitializedUserModel } = userModule;
const { Sequelize } = require('sequelize');

class AuthService {
  static async registerUser(username, email, password) {
    try {
      // Получаем инициализированную модель User
      const UserModel = await getInitializedUserModel();
      
      // Проверяем, существует ли пользователь с таким username или email
      const existingUser = await UserModel.findOne({
        where: {
          [Sequelize.Op.or]: [
            { username: username },
            { email: email }
          ]
        }
      });
      
      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error('Пользователь с таким именем уже существует');
        }
        if (existingUser.email === email) {
          throw new Error('Пользователь с таким email уже существует');
        }
      }
      
      const passwordHash = await hashPassword(password);
      const user = await UserModel.create({
        username,
        email,
        passwordHash,
        cultivationLevel: 1,
        experience: 0
      });
      return user;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  static async loginUser(usernameOrEmail, password) {
    try {
      // Получаем инициализированную модель User
      const UserModel = await getInitializedUserModel();
      
      // Поиск пользователя по email или имени пользователя
      const user = await UserModel.findOne({
        where: {
          [Sequelize.Op.or]: [
            { email: usernameOrEmail },
            { username: usernameOrEmail }
          ]
        }
      });
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Неверный пароль');
      }

      // Обновляем время последнего входа
      user.lastLogin = new Date();
      await user.save();

      return user;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  }

  static async updateUserProgress(userId, experience, cultivationLevel) {
    try {
      // Получаем инициализированную модель User
      const UserModel = await getInitializedUserModel();
      
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      user.experience = experience;
      user.cultivationLevel = cultivationLevel;
      await user.save();

      return user;
    } catch (error) {
      console.error('Ошибка обновления прогресса:', error);
      throw error;
    }
  }

  static async getUserProfile(userIdOrUsername) {
    try {
      // Получаем инициализированную модель User
      const UserModel = await getInitializedUserModel();
      
      let user;
      
      // Проверяем, является ли параметр числом (id) или строкой (username)
      if (typeof userIdOrUsername === 'number' || !isNaN(parseInt(userIdOrUsername))) {
        // Поиск по ID
        user = await UserModel.findByPk(userIdOrUsername, {
          attributes: ['id', 'username', 'email', 'cultivationLevel', 'experience']
        });
      } else {
        // Поиск по username
        user = await UserModel.findOne({
          where: { username: userIdOrUsername },
          attributes: ['id', 'username', 'email', 'cultivationLevel', 'experience']
        });
      }

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      return user;
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      throw error;
    }
  }
}

module.exports = AuthService;


// Экспортируем отдельные методы для совместимости
module.exports.registerUser = AuthService.registerUser;
module.exports.loginUser = AuthService.loginUser;
module.exports.updateUserProgress = AuthService.updateUserProgress;
module.exports.getUserProfile = AuthService.getUserProfile;