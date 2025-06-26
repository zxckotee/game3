/**
 * API-сервис для работы с сервером
 * Использует адаптеры для авторизации и хранения игровых данных
 */

// Импортируем сервисы через адаптеры для поддержки как серверного, так и браузерного окружения
const AuthService = require('./auth-adapter');
const CultivationService = require('./cultivation-adapter');
const InventoryService = require('./inventory-adapter');
const TechniqueService = require('./technique-adapter');
const CharacterStatsService = require('./character-stats-adapter');
const QuestService = require('./quest-adapter');
const ResourceService = require('./resource-adapter');
// Импортируем дополнительные адаптеры для данных, чтобы избежать прямых импортов из database-connection-manager
const EnemiesService = require('../data/enemies-adapter');
const MerchantsService = require('../data/merchants-adapter');
const QuestsData = require('../data/quests-adapter');
const EquipmentItems = require('../data/equipment-items-adapter');
const TechniquesData = require('../data/techniques-adapter');
const SpiritPetsService = require('../data/spirit-pets-adapter');
const { getInitializedUserModel } = require('../models/user-adapter');
const CharacterProfileService = require('./character-profile-service-adapter');
const initialRelationshipsModule = require('../utils/initialRelationships');
const initialRelationships = initialRelationshipsModule.default || initialRelationshipsModule;
const { getInitialRelationships } = initialRelationshipsModule;
const { hashPassword } = require('./web-crypto-hash');

// Базовый URL API (в реальном приложении)
// const API_URL = 'https://api.cultivationgame.com/v1';

// Имитация задержки сети
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Функция для выполнения HTTP-запросов к API
 * @param {string} method - HTTP-метод (GET, POST, PUT, DELETE)
 * @param {string} url - URL эндпоинта
 * @param {Object} data - Данные для отправки (для POST, PUT)
 * @returns {Promise<Object>} - Ответ от API
 */
const apiRequest = async (method, url, data = null) => {
  try {
    console.log(`[API] Выполняем ${method} запрос к ${url}`);
    
    // Добавляем задержку для имитации сетевого запроса
    await delay(200);
    
    // Формируем опции запроса
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Добавляем тело запроса для не-GET методов
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    // Проверка наличия токена авторизации
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(token);
    
    // Выполняем запрос
    const response = await fetch(url, options);
    
    // Проверка на ошибки HTTP
    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      throw new Error(errorJson.message || `HTTP error! status: ${response.status}  ${token}`);
    }
    
    // Получаем JSON-ответ
    const result = await response.json();
    console.log(`[API] Ответ от ${url}:`, result);
    
    return result;
  } catch (error) {
    console.error(`[API] Ошибка при ${method} запросе к ${url}:`, error);
    throw error;
  }
};

/**
 * Сервис для работы с API
 */
const apiService = {
  /**
   * Авторизация пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object>} - Данные пользователя и токен
   */
  async login(username, password) {
    // Имитация запроса к серверу
    await delay(1000);
    
    try {
      // Используем AuthService для авторизации через базу данных
      const user = await AuthService.loginUser(username, password);
      
      // Успешная авторизация
      console.log('Успешная авторизация:', user.username);
      
      // ИСПРАВЛЕНО: Используем токен, полученный от сервера, вместо генерации нового
      const token = user.authToken;
      
      // Сохраняем токен, имя пользователя и ID в localStorage для сессии
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', user.username);
      localStorage.setItem('userId', user.id.toString());
      console.log(`Сохранен userId: ${user.id} в localStorage`);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          cultivationLevel: user.cultivationLevel,
          experience: user.experience
        },
        token
      };
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  },
  
  /**
   * Регистрация нового пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object>} - Данные пользователя и токен
   */
  async register(username, password) {
    // Имитация запроса к серверу
    await delay(1000);
    
    try {
      // Создаем email на основе имени пользователя
      const email = `${username}@example.com`;
      
      // Используем AuthService для регистрации пользователя в базе данных
      const user = await AuthService.registerUser(username, email, password);
      
      // Логируем ID полученный от AuthService для отладки
      console.log(`[API/register] Получен пользователь с ID: ${user.id} после регистрации`);
      
      // ИСПРАВЛЕНО: Используем токен, полученный от сервера, вместо генерации нового
      const token = user.authToken;
      
      // Сохраняем токен, имя пользователя и ID в localStorage для сессии
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', username);
      localStorage.setItem('userId', user.id.toString());
      console.log(`Сохранен userId: ${user.id} в localStorage при регистрации`);
      
      console.log('Успешная регистрация:', username);
      
      // Не создаем профиль при регистрации - он будет создан при заполнении формы
      // Только подготавливаем начальные отношения для использования клиентом
      console.log(`[API] Профиль для пользователя ${user.id} будет создан при заполнении формы`);
      
      // Логируем для отладки, чтобы убедиться что правильный ID передается в Redux
      console.log(`[API/register] Возвращаем пользователя с ID: ${user.id} для обновления Redux`);
      
      // Не вызываем CharacterProfileService.updateCharacterProfile, чтобы не создавать пустой профиль
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          cultivationLevel: user.cultivationLevel,
          experience: user.experience,
          // Добавляем базовую структуру социальных данных для совместимости
          // но не создаем профиль в базе данных, он будет создан позже
          social: {
            sect: null,
            reputation: {},
            friends: [],
            relationships: getInitialRelationships()
          }
        },
        token
      };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  },
  
  /**
   * Выход из системы
   * @returns {Promise<void>}
   */
  async logout() {
    // Имитация запроса к серверу
    await delay(500);
    
    // Удаляем токен и данные пользователя
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    
    console.log('Выход из системы');
  },
  
  /**
   * Проверка авторизации
   * @returns {Promise<boolean>}
   */
  async checkAuth() {
    // Имитация запроса к серверу
    await delay(500);
    
    // Проверяем наличие токена, имени пользователя и userId в localStorage
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('currentUser');
    const userId = localStorage.getItem('userId');
    
    if (!token || !username || !userId) {
      console.log('Авторизация не пройдена: отсутствуют токен, имя пользователя или userId');
      return false;
    }
    
    // Проверяем наличие пользователя в базе данных
    try {
      const user = await AuthService.getUserProfile(username);
      return !!user;
    } catch (error) {
      console.warn('Ошибка проверки авторизации:', error);
      
      // Проверяем тип ошибки
      if (error.message && (
          error.message.includes('not found') ||
          error.message.includes('не найден') ||
          error.message.includes('404'))) {
        // Только если пользователь точно не найден, очищаем данные авторизации
        console.log('Пользователь не найден в базе данных, очищаем данные авторизации');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
      } else {
        // При других ошибках (сетевые проблемы и т.п.) сохраняем данные
        console.log('Временная ошибка авторизации, сохраняем данные сессии');
      }
      
      return false;
    }
  },
  
  /**
   * Получение данных текущего пользователя
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    // Имитация запроса к серверу
    await delay(500);
    
    // Получаем имя текущего пользователя
    const username = localStorage.getItem('currentUser');
    
    if (!username) {
      throw new Error('Пользователь не авторизован');
    }
    
    try {
      // Получаем пользователя из базы данных
      const user = await AuthService.getUserProfile(username);
      
      // Получаем профиль персонажа
      const characterProfile = await CharacterProfileService.getCharacterProfile(user.id);
      
      // Формируем и возвращаем данные пользователя
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        cultivationLevel: user.cultivationLevel,
        experience: user.experience,
        // Добавляем данные персонажа, если они есть
        ...(characterProfile ? {
          name: characterProfile.name,
          gender: characterProfile.gender,
          region: characterProfile.region,
          background: characterProfile.background,
          description: characterProfile.description,
          social: characterProfile.social || {
            sect: null,
            reputation: {},
            friends: [],
            relationships: getInitialRelationships()
          }
        } : {})
      };
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      throw error;
    }
  },
  
  /**
   * Получение профиля персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Профиль персонажа
   */
  async getCharacterProfile(userId) {
    try {
      if (!userId) {
        const currentUsername = localStorage.getItem('currentUser');
        if (!currentUsername) {
          throw new Error('Пользователь не авторизован');
        }
        
        const user = await AuthService.getUserProfile(currentUsername);
        userId = user.id;
      }
      
      const profile = await CharacterProfileService.getCharacterProfile(userId);
      return profile;
    } catch (error) {
      console.error('[API] Ошибка при получении профиля персонажа:', error);
      throw error;
    }
  },
  
  /**
   * Сохранение игрового состояния
   * @param {Object} gameState - Игровое состояние
   * @param {boolean} isExiting - Флаг, указывающий, что сохранение происходит при выходе из игры
   * @returns {Promise<Object>}
   */
  async saveGameState(gameState, isExiting = false, skipProfileUpdate = false) {
    try {
      // Имитация задержки сети
      await delay(300);
      
      // Получаем имя текущего пользователя
      const username = localStorage.getItem('currentUser');
      
      if (!username) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Получаем пользователя из базы данных
      const user = await AuthService.getUserProfile(username);
      
      if (!user) {
        throw new Error('Пользователь не найден в базе данных');
      }
      
      // Сохраняем данные в базу данных
      if (gameState && gameState.player) {
        // Сохраняем профиль персонажа только если не указано пропустить обновление профиля
        if (gameState.player.name && !skipProfileUpdate) {
          console.log(`[API] Сохранение профиля персонажа для пользователя ${user.id}, имя: ${gameState.player.name}`);
          
          const profileData = {
            name: gameState.player.name,
            gender: gameState.player.gender,
            region: gameState.player.region,
            background: gameState.player.background,
            description: gameState.player.description,
            avatar: gameState.player.avatar,
            level: gameState.player.level,
            experience: gameState.player.experience,
            currency: gameState.player.inventory?.currency || {gold: 0, silver: 0, copper: 0, spiritStones: 0},
            reputation: gameState.player.social?.reputation || {},
            relationships: gameState.player.social?.relationships || []
          };
          
          console.log('[API] Данные профиля для сохранения:', profileData);
          
          const savedProfile = await CharacterProfileService.updateCharacterProfile(user.id, profileData);
          console.log('[API] Результат сохранения профиля:', savedProfile);
        } else if (skipProfileUpdate) {
          console.log('[API] Пропуск сохранения профиля персонажа при автосохранении');
        } else {
          console.warn('[API] Не удалось сохранить профиль персонажа - имя отсутствует');
        }
      }
      
      console.log('[API] Игровое состояние сохранено в базе данных для пользователя:', username);
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при сохранении игрового состояния:', error);
      throw error;
    }
  },
  
  /**
   * Загрузка игрового состояния
   * @returns {Promise<Object>}
   */
  async loadGameState() {
    try {
      // Имитация задержки сети
      await delay(300);
      
      // Получаем имя текущего пользователя
      const username = localStorage.getItem('currentUser');
      
      if (!username) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Получаем пользователя из базы данных
      const user = await AuthService.getUserProfile(username);
      
      if (!user) {
        throw new Error('Пользователь не найден в базе данных');
      }
      
      // Создаем базовое игровое состояние
      const gameState = {
        player: {
          id: user.id,
          stats: {},
          cultivation: {},
          inventory: {
            items: [],
            equipment: {},
            currency: {
              copper: 0,
              silver: 0,
              gold: 0,
              spiritStones: 0
            }
          },
          techniques: [],
          progress: {
            quests: {
              active: [],
              available: [],
              completed: []
            },
            discoveries: {},
            achievements: {}
          },
          social: {
            sect: null,
            reputation: {},
            friends: [],
            relationships: getInitialRelationships() // Используем начальные отношения
          }
        },
        world: {
          currentLocation: null,
          time: {
            day: 1,
            hour: 6,
            minute: 0,
            season: 'spring',
            year: 1
          },
          weather: 'clear',
          events: []
        },
        ui: {
          currentScreen: 'world',
          notifications: [],
          dialogs: [],
          settings: {
            soundVolume: 0.5,
            musicVolume: 0.5,
            graphicsQuality: 'medium'
          }
        },
        achievements: {
          completed: [],
          points: 0
        },
        combat: {
          inCombat: false,
          enemy: null,
          log: [],
          turn: 1
        }
      };
      
      // Загружаем данные из базы данных
      
      // Загружаем профиль персонажа
      console.log(`[API] Загрузка профиля персонажа для пользователя ${user.id}`);
      const characterProfile = await CharacterProfileService.getCharacterProfile(user.id);
      console.log('[API] Загруженный профиль персонажа:', characterProfile);
      
      if (characterProfile) {
        // Если профиль персонажа существует, загружаем его данные
        gameState.player.name = characterProfile.name;
        gameState.player.gender = characterProfile.gender;
        gameState.player.region = characterProfile.region;
        gameState.player.background = characterProfile.background;
        gameState.player.description = characterProfile.description;
        gameState.player.avatar = characterProfile.avatar;
        gameState.player.level = characterProfile.level;
        gameState.player.experience = characterProfile.experience;
        gameState.player.inventory.currency = characterProfile.currency || {gold: 0, silver: 0, copper: 0, spiritStones: 0};
        gameState.player.social.reputation = characterProfile.reputation || {};
        
        // Проверка и преобразование relationships
        if (characterProfile.relationships) {
          // Если relationships существует, проверяем формат
          if (!Array.isArray(characterProfile.relationships)) {
            console.log('Преобразование relationships из объекта в массив');
            // Если это объект, преобразуем его в массив
            gameState.player.social.relationships = Object.values(characterProfile.relationships);
          } else {
            // Если это массив, используем его
            gameState.player.social.relationships = characterProfile.relationships;
          }
          
          // Если relationships пустой, используем начальные отношения
          if (Array.isArray(gameState.player.social.relationships) && 
              gameState.player.social.relationships.length === 0) {
            console.log('Relationships пустой, используем начальные отношения');
            gameState.player.social.relationships = getInitialRelationships();
          }
        } else {
          // Если relationships не существует, используем начальные отношения
          console.log('Relationships не найден, используем начальные отношения');
          gameState.player.social.relationships = getInitialRelationships();
        }
      }
      
      // Загружаем данные о культивации
      console.log(`[API] Загрузка данных о культивации для пользователя ${user.id}`);
      const cultivation = await CultivationService.getCultivationProgress(user.id);
      gameState.player.cultivation = cultivation;
      console.log('[API] Загруженные данные о культивации:', cultivation);
      
      // Загружаем характеристики персонажа
      console.log(`[API] Загрузка характеристик персонажа для пользователя ${user.id}`);
      const stats = await CharacterStatsService.getCharacterStats(user.id);
      gameState.player.stats = stats;
      console.log('[API] Загруженные характеристики персонажа:', stats);
      
      // Загружаем вторичные характеристики
      const secondaryStats = CharacterStatsService.calculateSecondaryStats(stats, cultivation);
      gameState.player.secondaryStats = secondaryStats;
      
      // Загружаем инвентарь
      const inventoryItems = await InventoryService.getInventoryItems(user.id);
      gameState.player.inventory.items = inventoryItems;
      
      // Загружаем изученные техники
      const techniques = await TechniqueService.getLearnedTechniques(user.id);
      gameState.player.techniques = techniques;
      
      // Загружаем задания
      const quests = await QuestService.getQuests(user.id);
      gameState.player.progress.quests = quests;
      
      console.log('Игровое состояние загружено из базы данных для пользователя:', username);
      
      return gameState;
    } catch (error) {
      console.error('Ошибка при загрузке игрового состояния:', error);
      throw error;
    }
  },
  
  /**
   * Миграция пользователей из localStorage в базу данных
   * @returns {Promise<Object>} - Результат миграции
   */
  async migrateUsersToDatabase() {
    try {
      // Получаем пользователей из localStorage
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const migrationResults = {
        success: true,
        processed: 0,
        migrated: 0,
        skipped: 0,
        errors: []
      };
      
      // Для каждого пользователя в localStorage
      for (const username in users) {
        migrationResults.processed++;
        const localUser = users[username];
        
        try {
          // Проверяем, существует ли пользователь в БД
          let dbUser = null;
          try {
            const UserModel = await getInitializedUserModel();
            dbUser = await UserModel.findOne({ where: { username } });
          } catch (findError) {
            console.error(`Ошибка при поиске пользователя ${username}:`, findError);
            migrationResults.errors.push({
              username,
              stage: 'search',
              error: findError.message
            });
          }
          
          if (!dbUser) {
            // Создаем пользователя в БД
            const email = localUser.email || `${username}@example.com`;
            
            try {
              // Создаем хешированный пароль с использованием WebCrypto вместо bcrypt
              const passwordHash = await hashPassword(localUser.password);
              
              // Создаем пользователя
              const UserModel = await getInitializedUserModel();
              await UserModel.create({
                username,
                email,
                passwordHash,
                cultivationLevel: 1,
                experience: 0,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              
              console.log(`Пользователь ${username} успешно мигрирован в БД`);
              migrationResults.migrated++;
            } catch (createError) {
              console.error(`Ошибка при создании пользователя ${username} в БД:`, createError);
              migrationResults.errors.push({
                username,
                stage: 'create',
                error: createError.message
              });
            }
          } else {
            console.log(`Пользователь ${username} уже существует в БД`);
            migrationResults.skipped++;
          }
        } catch (error) {
          console.error(`Ошибка при миграции пользователя ${username}:`, error);
          migrationResults.errors.push({
            username,
            stage: 'process',
            error: error.message
          });
        }
      }
      
      return migrationResults;
    } catch (error) {
      console.error('Общая ошибка миграции пользователей:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Получение данных о культивации пользователя
   * @param {number} userId - ID пользователя, для которого запрашиваются данные
   * @returns {Promise<Object>} - Данные о культивации
   */
  async getCultivationProgress(userId) {
    try {
      if (!userId) {
        // Если ID не передан, пытаемся получить ID текущего пользователя
        const currentUsername = localStorage.getItem('currentUser');
        if (!currentUsername) {
          throw new Error('Пользователь не авторизован');
        }
        
        const user = await AuthService.getUserProfile(currentUsername);
        userId = user.id;
      }
      
      console.log(`[API] Запрашиваем данные о культивации для пользователя ${userId}`);
      
      // Получение данных через GET-запрос к API
      const response = await fetch(`/api/cultivation/${userId}`);
      if (!response.ok) {
        throw new Error(`Ошибка получения данных о культивации: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API] Получены данные о культивации:', data);
      return data;
    } catch (error) {
      console.error('[API] Ошибка при получении данных о культивации:', error);
      throw error;
    }
  }
};

module.exports = apiService;

// Добавляем именованный экспорт для api, который используется в *-api.js файлах
module.exports.api = {
  get: async (url) => {
    // Простая заглушка для API запросов на сервере
    return { data: [] };
  },
  post: async (url, data) => {
    return { data: {} };
  },
  put: async (url, data) => {
    return { data: {} };
  },
  delete: async (url) => {
    return { data: { success: true } };
  }
};

// Экспортируем функцию apiRequest для использования в других модулях
module.exports.apiRequest = apiRequest;

// Добавляем поддержку для ESM-импортов
if (typeof window !== 'undefined') {
  window.__api_exports = { apiRequest };
  
  // Создаем шим для поддержки ES модулей в старом коде
  if (!window.exports && !window.module) {
    window.exports = {};
    window.module = { exports: {} };
  }
}

// Помечаем модуль как ES модуль для лучшей совместимости
if (typeof module !== 'undefined') {
  module.exports.__esModule = true;
}

// Устанавливаем свойство default для поддержки default imports
module.exports.default = apiService;
