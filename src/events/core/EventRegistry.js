/**
 * EventRegistry.js
 * Реестр для регистрации и управления плагинами событий
 */

export class EventRegistry {
  constructor() {
    this.plugins = new Map();
    this.events = new Map();
  }
  
  /**
   * Регистрирует плагин событий
   * @param {string} pluginId - Идентификатор плагина
   * @param {Object} plugin - Объект плагина с массивом events
   * @returns {boolean} Результат регистрации
   */
  registerPlugin(pluginId, plugin) {
    if (this.plugins.has(pluginId)) {
      console.warn(`Плагин с ID ${pluginId} уже зарегистрирован. Перезаписываем.`);
    }
    
    this.plugins.set(pluginId, plugin);
    console.log(`Зарегистрирован плагин событий: ${pluginId}`);
    
    // Регистрируем события плагина
    if (plugin.events && Array.isArray(plugin.events)) {
      for (const EventClass of plugin.events) {
        this.registerEvent(EventClass);
      }
    }
    
    return true;
  }
  
  /**
   * Регистрирует класс события
   * @param {Class} EventClass - Класс события, наследующий AbstractEvent
   * @returns {boolean} Результат регистрации
   */
  registerEvent(EventClass) {
    try {
      // Создаем экземпляр для получения метаданных
      const event = new EventClass();
      const eventId = event.id;
      
      if (this.events.has(eventId)) {
        console.warn(`Событие с ID ${eventId} уже зарегистрировано. Перезаписываем.`);
      }
      
      // Сохраняем класс события, а не экземпляр
      this.events.set(eventId, EventClass);
      console.log(`Зарегистрировано событие: ${event.name} (${eventId})`);
      
      return true;
    } catch (error) {
      console.error(`Ошибка при регистрации события: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Возвращает класс события по ID
   * @param {string} eventId - ID события
   * @returns {Class|null} Класс события или null, если не найден
   */
  getEvent(eventId) {
    return this.events.get(eventId) || null;
  }
  
  /**
   * Возвращает все зарегистрированные классы событий
   * @returns {Array} Массив классов событий
   */
  getAllEvents() {
    return Array.from(this.events.values());
  }
  
  /**
   * Возвращает события определенной категории
   * @param {string} category - Категория событий (nature, social, combat, cycle)
   * @returns {Array} Массив классов событий указанной категории
   */
  getEventsByCategory(category) {
    const events = [];
    
    for (const EventClass of this.events.values()) {
      const event = new EventClass();
      if (event.category === category) {
        events.push(EventClass);
      }
    }
    
    return events;
  }
  
  /**
   * Возвращает события определенной редкости
   * @param {string} rarity - Редкость событий (common, uncommon, rare, epic, legendary)
   * @returns {Array} Массив классов событий указанной редкости
   */
  getEventsByRarity(rarity) {
    const events = [];
    
    for (const EventClass of this.events.values()) {
      const event = new EventClass();
      if (event.rarity === rarity) {
        events.push(EventClass);
      }
    }
    
    return events;
  }
  
  /**
   * Удаляет плагин и все его события
   * @param {string} pluginId - ID плагина
   * @returns {boolean} Результат удаления
   */
  unregisterPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }
    
    // Удаляем все события, принадлежащие плагину
    if (plugin.events && Array.isArray(plugin.events)) {
      for (const EventClass of plugin.events) {
        const event = new EventClass();
        this.events.delete(event.id);
      }
    }
    
    // Удаляем сам плагин
    this.plugins.delete(pluginId);
    console.log(`Плагин ${pluginId} удален`);
    
    return true;
  }
  
  /**
   * Удаляет событие по ID
   * @param {string} eventId - ID события
   * @returns {boolean} Результат удаления
   */
  unregisterEvent(eventId) {
    if (!this.events.has(eventId)) {
      return false;
    }
    
    this.events.delete(eventId);
    console.log(`Событие ${eventId} удалено`);
    
    return true;
  }
  
  /**
   * Очищает все зарегистрированные плагины и события
   */
  clear() {
    this.plugins.clear();
    this.events.clear();
    console.log('Реестр событий очищен');
  }
  
  /**
   * Возвращает информацию о состоянии реестра
   * @returns {Object} Информация о реестре
   */
  getRegistryInfo() {
    return {
      pluginsCount: this.plugins.size,
      eventsCount: this.events.size,
      plugins: Array.from(this.plugins.keys()),
      events: Array.from(this.events.entries()).map(([id, EventClass]) => {
        const event = new EventClass();
        return {
          id,
          name: event.name,
          category: event.category,
          rarity: event.rarity
        };
      })
    };
  }
}
