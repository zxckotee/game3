/**
 * Клиентская версия EventService без серверных зависимостей
 * Используется в браузере вместо оригинального event-service.js
 */

// Типы событий
const EVENT_TYPES = {
  COMBAT: 'combat',
  SOCIAL: 'social',
  NATURE: 'nature',
  CYCLE: 'cycle',
  CONFLICT: 'conflict',
  QUEST: 'quest',
  SPECIAL: 'special'
};

// Категории событий
const EVENT_CATEGORIES = {
  COMMON: 'common',
  RARE: 'rare',
  SPECIAL: 'special',
  SEASONAL: 'seasonal',
  FACTION: 'faction',
  STORY: 'story'
};

// Приоритеты событий
const EVENT_PRIORITIES = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

// Моковые данные о событиях
const mockEvents = [
  {
    id: 'bandit_attack',
    name: 'Нападение бандитов',
    description: 'Группа бандитов устраивает засаду на дороге.',
    type: EVENT_TYPES.COMBAT,
    category: EVENT_CATEGORIES.COMMON,
    priority: EVENT_PRIORITIES.MEDIUM,
    minLevel: 1,
    requiredStage: 'Закалка тела',
    requiredLocation: 'forest_path',
    conditions: {
      time: { min: 18, max: 6 }, // Вечер и ночь
      weather: ['clear', 'cloudy', 'fog'],
      probability: 0.3 // 30% шанс возникновения при выполнении условий
    },
    rewards: {
      exp: 50,
      resources: [
        { id: 'copper_coin', amount: [10, 30] },
        { id: 'bandit_token', amount: [1, 3] }
      ]
    }
  },
  {
    id: 'spirit_storm',
    name: 'Духовный шторм',
    description: 'Мощный поток духовной энергии проходит через область, создавая множество возможностей и опасностей.',
    type: EVENT_TYPES.NATURE,
    category: EVENT_CATEGORIES.RARE,
    priority: EVENT_PRIORITIES.HIGH,
    minLevel: 5,
    requiredStage: 'Закалка тела',
    requiredLocation: null, // Может произойти в любой локации
    conditions: {
      time: null, // Любое время
      weather: ['thunderstorm'],
      probability: 0.5 // 50% шанс во время грозы
    },
    rewards: {
      exp: 200,
      resources: [
        { id: 'spirit_essence', amount: [5, 10] },
        { id: 'energy_crystal', amount: [1, 3] }
      ]
    }
  },
  {
    id: 'cultivator_fair',
    name: 'Ярмарка культиваторов',
    description: 'Ежегодная ярмарка, где культиваторы собираются для обмена ресурсами, техниками и информацией.',
    type: EVENT_TYPES.SOCIAL,
    category: EVENT_CATEGORIES.SEASONAL,
    priority: EVENT_PRIORITIES.MEDIUM,
    minLevel: 1,
    requiredStage: null, // Любая стадия
    requiredLocation: 'town_square',
    conditions: {
      time: { min: 8, max: 18 }, // Только днем
      weather: ['clear', 'cloudy'],
      season: 'autumn', // Только осенью
      dateRange: { start: 15, end: 20 }, // С 15 по 20 день сезона
      probability: 1.0 // 100% шанс при выполнении условий
    },
    rewards: {
      exp: 100,
      resources: [
        { id: 'fair_token', amount: [5, 5] }
      ]
    }
  },
  {
    id: 'lunar_phase',
    name: 'Смена лунной фазы',
    description: 'Луна переходит в новую фазу, влияя на силу культивации и духовную энергию.',
    type: EVENT_TYPES.CYCLE,
    category: EVENT_CATEGORIES.COMMON,
    priority: EVENT_PRIORITIES.LOW,
    minLevel: 1,
    requiredStage: null,
    requiredLocation: null,
    conditions: {
      time: { min: 20, max: 4 }, // Вечер и ночь
      probability: 0.2 // 20% шанс каждую ночь
    },
    rewards: {
      effects: [
        { id: 'moon_blessing', duration: 1440 } // 24 часа (в минутах)
      ]
    }
  },
  {
    id: 'demonic_cultivator',
    name: 'Появление демонического культиватора',
    description: 'Демонический культиватор ищет жертв для своих темных практик.',
    type: EVENT_TYPES.CONFLICT,
    category: EVENT_CATEGORIES.RARE,
    priority: EVENT_PRIORITIES.HIGH,
    minLevel: 10,
    requiredStage: 'Построение основания',
    requiredLocation: null,
    conditions: {
      time: { min: 22, max: 4 }, // Только глубокой ночью
      weather: ['fog', 'cloudy', 'thunderstorm'],
      probability: 0.15 // 15% шанс при выполнении условий
    },
    rewards: {
      exp: 500,
      resources: [
        { id: 'demonic_essence', amount: [1, 3] },
        { id: 'spirit_stone', amount: [5, 10] }
      ]
    }
  }
];

// Моковые активные события пользователя
const mockActiveEvents = [];

class EventServiceAPI {
  /**
   * Получает все доступные типы событий
   * @returns {Promise<Object>} Объект с типами событий
   */
  static async getEventTypes() {
    return Promise.resolve(EVENT_TYPES);
  }

  /**
   * Получает все категории событий
   * @returns {Promise<Object>} Объект с категориями событий
   */
  static async getEventCategories() {
    return Promise.resolve(EVENT_CATEGORIES);
  }

  /**
   * Получает все события
   * @returns {Promise<Array>} Массив всех событий
   */
  static async getAllEvents() {
    return Promise.resolve([...mockEvents]);
  }

  /**
   * Получает событие по ID
   * @param {string} eventId ID события
   * @returns {Promise<Object|null>} Объект события или null, если не найден
   */
  static async getEventById(eventId) {
    const event = mockEvents.find(event => event.id === eventId);
    return Promise.resolve(event ? {...event} : null);
  }

  /**
   * Получает активные события пользователя
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив активных событий пользователя
   */
  static async getUserActiveEvents(userId) {
    return Promise.resolve([...mockActiveEvents]);
  }

  /**
   * Проверяет и обновляет события для пользователя
   * @param {number} userId ID пользователя
   * @param {Object} context Контекст игрока (локация, время, погода и т.д.)
   * @returns {Promise<Object>} Результат проверки с новыми событиями
   */
  static async checkForEvents(userId, context) {
    // В клиентской версии симулируем генерацию случайного события
    const randomEvent = this._generateRandomEvent(context);
    
    if (randomEvent) {
      // Добавляем событие в список активных
      const activeEvent = {
        id: Date.now(),
        eventId: randomEvent.id,
        eventData: randomEvent,
        userId,
        status: 'active',
        expireAt: new Date(Date.now() + 30 * 60 * 1000), // Истекает через 30 минут
        createdAt: new Date()
      };
      
      mockActiveEvents.push(activeEvent);
      
      return Promise.resolve({
        newEvents: [activeEvent],
        updatedEvents: [],
        expiredEvents: []
      });
    }
    
    return Promise.resolve({
      newEvents: [],
      updatedEvents: [],
      expiredEvents: []
    });
  }

  /**
   * Начинает интерактивное событие
   * @param {number} userId ID пользователя
   * @param {number} activeEventId ID активного события
   * @returns {Promise<Object>} Результат начала события
   */
  static async startEvent(userId, activeEventId) {
    const activeEvent = mockActiveEvents.find(event => event.id === activeEventId && event.userId === userId);
    
    if (!activeEvent) {
      return Promise.reject(new Error('Событие не найдено'));
    }
    
    if (activeEvent.status !== 'active') {
      return Promise.reject(new Error('Событие уже запущено или завершено'));
    }
    
    // Обновляем статус события
    activeEvent.status = 'in_progress';
    
    return Promise.resolve({
      success: true,
      message: `Событие "${activeEvent.eventData.name}" начато`,
      event: activeEvent
    });
  }

  /**
   * Завершает интерактивное событие
   * @param {number} userId ID пользователя
   * @param {number} activeEventId ID активного события
   * @param {Object} result Результат события
   * @returns {Promise<Object>} Результат завершения события
   */
  static async completeEvent(userId, activeEventId, result) {
    const activeEvent = mockActiveEvents.find(event => event.id === activeEventId && event.userId === userId);
    
    if (!activeEvent) {
      return Promise.reject(new Error('Событие не найдено'));
    }
    
    if (activeEvent.status !== 'in_progress') {
      return Promise.reject(new Error('Событие не было запущено или уже завершено'));
    }
    
    // Обновляем статус события
    activeEvent.status = result.success ? 'completed' : 'failed';
    activeEvent.result = result;
    activeEvent.completedAt = new Date();
    
    // Формируем награды на основе базовых наград события и результата
    const rewards = activeEvent.eventData.rewards;
    const rewardsList = [];
    
    if (rewards.exp) {
      rewardsList.push({
        type: 'exp',
        amount: rewards.exp * (result.success ? 1 : 0.5) // При неудаче половина опыта
      });
    }
    
    if (rewards.resources && result.success) {
      rewards.resources.forEach(resource => {
        const amount = Math.floor(Math.random() * (resource.amount[1] - resource.amount[0] + 1)) + resource.amount[0];
        rewardsList.push({
          type: 'resource',
          id: resource.id,
          amount
        });
      });
    }
    
    return Promise.resolve({
      success: true,
      message: result.success 
        ? `Событие "${activeEvent.eventData.name}" успешно завершено` 
        : `Событие "${activeEvent.eventData.name}" провалено`,
      event: activeEvent,
      rewards: rewardsList
    });
  }

  /**
   * Отменяет активное событие
   * @param {number} userId ID пользователя
   * @param {number} activeEventId ID активного события
   * @returns {Promise<Object>} Результат отмены события
   */
  static async cancelEvent(userId, activeEventId) {
    const activeEventIndex = mockActiveEvents.findIndex(event => event.id === activeEventId && event.userId === userId);
    
    if (activeEventIndex === -1) {
      return Promise.reject(new Error('Событие не найдено'));
    }
    
    // Удаляем событие из списка активных
    const activeEvent = mockActiveEvents[activeEventIndex];
    mockActiveEvents.splice(activeEventIndex, 1);
    
    return Promise.resolve({
      success: true,
      message: `Событие "${activeEvent.eventData.name}" отменено`,
      event: activeEvent
    });
  }

  /**
   * Генерирует случайное событие на основе контекста
   * @param {Object} context Контекст игрока
   * @returns {Object|null} Сгенерированное событие или null
   * @private
   */
  static _generateRandomEvent(context) {
    // Фильтруем события по условиям
    const possibleEvents = mockEvents.filter(event => {
      // Проверка уровня
      if (event.minLevel && context.level < event.minLevel) {
        return false;
      }
      
      // Проверка стадии культивации
      if (event.requiredStage && context.cultivation?.stage !== event.requiredStage) {
        return false;
      }
      
      // Проверка локации
      if (event.requiredLocation && context.location !== event.requiredLocation) {
        return false;
      }
      
      // Проверка времени
      if (event.conditions.time) {
        const hour = context.time?.hour || new Date().getHours();
        const { min, max } = event.conditions.time;
        
        if (min < max) {
          // Обычный диапазон (например, 8-18)
          if (hour < min || hour > max) {
            return false;
          }
        } else {
          // Диапазон через полночь (например, 22-4)
          if (hour < min && hour > max) {
            return false;
          }
        }
      }
      
      // Проверка погоды
      if (event.conditions.weather && !event.conditions.weather.includes(context.weather?.currentWeather)) {
        return false;
      }
      
      // Проверка сезона
      if (event.conditions.season && context.weather?.currentSeason !== event.conditions.season) {
        return false;
      }
      
      // Проверка диапазона дат
      if (event.conditions.dateRange) {
        const day = context.weather?.seasonDay || 1;
        if (day < event.conditions.dateRange.start || day > event.conditions.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
    
    if (possibleEvents.length === 0) {
      return null;
    }
    
    // Выбираем случайное событие с учетом приоритета
    possibleEvents.sort((a, b) => b.priority - a.priority);
    
    for (const event of possibleEvents) {
      // Проверяем вероятность возникновения
      if (Math.random() <= event.conditions.probability) {
        return event;
      }
    }
    
    return null;
  }
}

// Экспортируем класс через CommonJS
module.exports = EventServiceAPI;

// Экспортируем константы для совместимости
const EVENT_TYPES_EXPORT = EVENT_TYPES;
const EVENT_CATEGORIES_EXPORT = EVENT_CATEGORIES;
const EVENT_PRIORITIES_EXPORT = EVENT_PRIORITIES;

// Экспортируем отдельные методы для совместимости
module.exports.getEventTypes = EventServiceAPI.getEventTypes;
module.exports.getEventCategories = EventServiceAPI.getEventCategories;
module.exports.getAllEvents = EventServiceAPI.getAllEvents;
module.exports.getEventById = EventServiceAPI.getEventById;
module.exports.getUserActiveEvents = EventServiceAPI.getUserActiveEvents;
module.exports.checkForEvents = EventServiceAPI.checkForEvents;
module.exports.startEvent = EventServiceAPI.startEvent;
module.exports.completeEvent = EventServiceAPI.completeEvent;
module.exports.cancelEvent = EventServiceAPI.cancelEvent;