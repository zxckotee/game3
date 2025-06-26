/**
 * event-service.js
 * Сервис для работы с событиями в игре
 */

const { EventManager } = require('../events/core/EventManager');

// Импорт плагинов событий
// В будущем здесь будут импорты всех плагинов

class EventService {
  constructor(models) {
    this.models = models;
    this.eventManager = new EventManager();
    this.isInitialized = false;
  }
  
  /**
   * Инициализация сервиса событий
   * @returns {Promise<boolean>} Результат инициализации
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('EventService уже инициализирован');
        return true;
      }
      
      // Импортируем и регистрируем плагины событий
      const plugins = await this.loadPlugins();
      
      // Инициализируем менеджер событий
      const initialized = this.eventManager.initialize(plugins);
      this.isInitialized = initialized;
      
      console.log(`EventService инициализирован. Загружено плагинов: ${plugins.length}`);
      return initialized;
    } catch (error) {
      console.error('Ошибка при инициализации EventService:', error);
      return false;
    }
  }
  
  /**
   * Загружает плагины событий
   * @returns {Promise<Array>} Массив плагинов
   */
  async loadPlugins() {
    try {
      // В реальной реализации здесь будет динамическая загрузка плагинов
      // из соответствующих файлов
      
      // Для прототипа используем хардкодед список
      const plugins = [];
      
      // В будущем здесь будут импорты и добавление плагинов
      // например:
      // const naturePlugin = await import('../events/plugins/nature');
      // plugins.push(naturePlugin.default);
      
      return plugins;
    } catch (error) {
      console.error('Ошибка при загрузке плагинов событий:', error);
      return [];
    }
  }
  
  /**
   * Проверяет и генерирует события на основе текущего контекста
   * @param {Object} state - Текущее состояние игры
   * @returns {Array} Массив новых событий
   */
  checkEvents(state) {
    if (!this.isInitialized) {
      console.warn('EventService не инициализирован');
      return [];
    }
    
    // Создаем контекст события
    const context = this.createEventContext(state);
    
    // Делегируем проверку менеджеру событий
    return this.eventManager.checkForEvents(context);
  }
  
  /**
   * Создает контекст для событий на основе состояния игры
   * @param {Object} state - Состояние игры из GameContext
   * @returns {Object} Контекст события
   */
  createEventContext(state) {
    return {
      player: state.player,
      world: state.world,
      // Передаем другие необходимые данные из состояния
    };
  }
  
  /**
   * Обрабатывает выбор игрока в рамках события
   * @param {string} instanceId - ID экземпляра события
   * @param {number} choiceIndex - Индекс выбранного действия
   * @param {Object} state - Текущее состояние игры
   * @returns {Object} Результат выбора
   */
  processChoice(instanceId, choiceIndex, state) {
    if (!this.isInitialized) {
      return { success: false, message: 'EventService не инициализирован' };
    }
    
    const context = this.createEventContext(state);
    return this.eventManager.processChoice(instanceId, choiceIndex, context);
  }
  
  /**
   * Получает все активные события
   * @returns {Array} Массив активных событий
   */
  getActiveEvents() {
    if (!this.isInitialized) {
      return [];
    }
    
    return this.eventManager.getAllActiveEvents();
  }
  
  /**
   * Получает активные события определенной категории
   * @param {string} category - Категория событий (nature, social, combat, cycle)
   * @returns {Array} Массив активных событий указанной категории
   */
  getActiveEventsByCategory(category) {
    if (!this.isInitialized) {
      return [];
    }
    
    return this.eventManager.getActiveEventsByCategory(category);
  }
  
  /**
   * Принудительно завершает событие
   * @param {string} instanceId - ID экземпляра события
   * @param {Object} state - Текущее состояние игры
   * @returns {boolean} Успешность завершения
   */
  forceEndEvent(instanceId, state) {
    if (!this.isInitialized) {
      return false;
    }
    
    const context = this.createEventContext(state);
    return this.eventManager.forceEndEvent(instanceId, context);
  }
  
  /**
   * Сохраняет состояние всех событий в базу данных
   * @param {number} userId - ID пользователя
   * @returns {Promise<boolean>} Результат сохранения
   */
  async saveEvents(userId) {
    try {
      if (!this.isInitialized || !this.models) {
        return false;
      }
      
      // Получаем все активные события
      const activeEvents = this.eventManager.getAllActiveEvents();
      
      // В реальной реализации здесь был бы код для сохранения
      // активных событий и кулдаунов в базу данных
      
      console.log(`Сохранено ${activeEvents.length} активных событий для пользователя ${userId}`);
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении событий:', error);
      return false;
    }
  }
  
  /**
   * Загружает состояние событий из базы данных
   * @param {number} userId - ID пользователя
   * @returns {Promise<boolean>} Результат загрузки
   */
  async loadEvents(userId) {
    try {
      if (!this.isInitialized || !this.models) {
        return false;
      }
      
      // В реальной реализации здесь был бы код для загрузки
      // активных событий и кулдаунов из базы данных
      
      console.log(`Загружены события для пользователя ${userId}`);
      return true;
    } catch (error) {
      console.error('Ошибка при загрузке событий:', error);
      return false;
    }
  }
  
  /**
   * Получает информацию о реестре событий
   * @returns {Object} Информация о зарегистрированных событиях
   */
  getRegistryInfo() {
    if (!this.isInitialized) {
      return { pluginsCount: 0, eventsCount: 0, plugins: [], events: [] };
    }
    
    return this.eventManager.registry.getRegistryInfo();
  }
}

// Экспортируем синглтон сервиса
const eventService = new EventService();

module.exports = eventService;
