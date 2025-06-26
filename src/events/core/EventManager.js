/**
 * EventManager.js
 * Центральный менеджер для управления событиями в игре
 */

import { EventRegistry } from './EventRegistry';

export class EventManager {
  constructor() {
    this.registry = new EventRegistry();
    this.activeEvents = new Map(); // Активные экземпляры событий
    this.eventCooldowns = new Map(); // Кулдауны для событий
    this.lastCheck = null; // Время последней проверки событий
    this.checkInterval = 30; // Интервал проверки событий (в игровых минутах)
  }
  
  /**
   * Инициализирует менеджер событий и загружает плагины
   * @param {Array} plugins - Массив плагинов для загрузки
   * @returns {boolean} Успешность инициализации
   */
  initialize(plugins = []) {
    try {
      // Регистрируем плагины
      for (const plugin of plugins) {
        this.registry.registerPlugin(plugin.id, plugin);
      }
      
      console.log('EventManager инициализирован успешно');
      console.log(`Зарегистрировано плагинов: ${this.registry.plugins.size}`);
      console.log(`Зарегистрировано событий: ${this.registry.events.size}`);
      
      return true;
    } catch (error) {
      console.error('Ошибка при инициализации EventManager:', error);
      return false;
    }
  }
  
  /**
   * Проверяет условия для генерации новых событий
   * @param {Object} context - Игровой контекст
   * @returns {Array} Массив новых активированных событий
   */
  checkForEvents(context) {
    const currentTime = context.world.time;
    
    // Если это первая проверка или прошло достаточно времени с последней проверки
    if (!this.lastCheck || this.getTimeDifferenceInMinutes(this.lastCheck, currentTime) >= this.checkInterval) {
      this.lastCheck = { ...currentTime };
      
      // Обрабатываем активные события, у которых истек срок
      this.processExpiredEvents(context);
      
      // Обновляем кулдауны событий
      this.updateEventCooldowns(context);
      
      // Генерируем новые события
      return this.generateEvents(context);
    }
    
    return [];
  }
  
  /**
   * Генерирует новые события на основе текущего контекста
   * @param {Object} context - Игровой контекст
   * @returns {Array} Массив новых активированных событий
   */
  generateEvents(context) {
    const newEvents = [];
    
    // Получаем все классы событий
    const eventClasses = this.registry.getAllEvents();
    
    for (const EventClass of eventClasses) {
      try {
        // Создаем экземпляр события
        const event = new EventClass();
        
        // Пропускаем события на кулдауне
        if (this.eventCooldowns.has(event.id)) {
          continue;
        }
        
        // Проверяем условия для активации события
        if (event.checkConditions(context)) {
          // Активируем событие
          const activatedEvent = event.activate(context);
          
          // Сохраняем экземпляр в активных событиях
          this.activeEvents.set(event._instanceId, event);
          
          // Устанавливаем кулдаун
          this.eventCooldowns.set(event.id, {
            eventId: event.id,
            until: this.calculateTimeAfterDays(context.world.time, event.cooldown)
          });
          
          // Добавляем в список новых событий
          newEvents.push(activatedEvent);
        }
      } catch (error) {
        console.error(`Ошибка при генерации события ${EventClass.name}:`, error);
      }
    }
    
    return newEvents;
  }
  
  /**
   * Обрабатывает события с истекшим сроком действия
   * @param {Object} context - Игровой контекст
   * @returns {Array} Массив завершенных событий
   */
  processExpiredEvents(context) {
    const expiredEvents = [];
    const currentTime = context.world.time;
    
    for (const [instanceId, event] of this.activeEvents.entries()) {
      if (event.isExpired(currentTime)) {
        // Завершаем событие
        event.conclude(context);
        
        // Сохраняем информацию о завершенном событии
        expiredEvents.push({
          instanceId,
          id: event.id,
          name: event.name
        });
        
        // Удаляем из активных событий
        this.activeEvents.delete(instanceId);
      }
    }
    
    return expiredEvents;
  }
  
  /**
   * Обновляет кулдауны событий
   * @param {Object} context - Игровой контекст
   */
  updateEventCooldowns(context) {
    const currentTime = context.world.time;
    
    for (const [eventId, cooldownInfo] of this.eventCooldowns.entries()) {
      // Проверяем, закончился ли кулдаун
      if (this.isTimeAfter(currentTime, cooldownInfo.until)) {
        // Удаляем кулдаун
        this.eventCooldowns.delete(eventId);
      }
    }
  }
  
  /**
   * Обрабатывает выбор игрока в рамках события
   * @param {string} instanceId - ID экземпляра события
   * @param {number} choiceIndex - Индекс выбранного варианта
   * @param {Object} context - Игровой контекст
   * @returns {Object} Результат выбора
   */
  processChoice(instanceId, choiceIndex, context) {
    const event = this.activeEvents.get(instanceId);
    
    if (!event) {
      return { 
        success: false, 
        message: 'Событие не найдено или уже завершено' 
      };
    }
    
    // Делегируем обработку выбора самому событию
    const result = event.processChoice(choiceIndex, context);
    
    // Если событие завершено, удаляем его из активных
    if (result.eventConcluded) {
      this.activeEvents.delete(instanceId);
    }
    
    return result;
  }
  
  /**
   * Получает активное событие по ID экземпляра
   * @param {string} instanceId - ID экземпляра события
   * @returns {Object|null} Экземпляр события или null, если не найден
   */
  getActiveEvent(instanceId) {
    return this.activeEvents.get(instanceId) || null;
  }
  
  /**
   * Получает все активные события
   * @returns {Array} Массив активных событий
   */
  getAllActiveEvents() {
    return Array.from(this.activeEvents.values()).map(event => event.getState());
  }
  
  /**
   * Получает активные события определенной категории
   * @param {string} category - Категория событий
   * @returns {Array} Массив активных событий указанной категории
   */
  getActiveEventsByCategory(category) {
    return Array.from(this.activeEvents.values())
      .filter(event => event.category === category)
      .map(event => event.getState());
  }
  
  /**
   * Принудительно завершает событие
   * @param {string} instanceId - ID экземпляра события
   * @param {Object} context - Игровой контекст
   * @returns {boolean} Успешность завершения
   */
  forceEndEvent(instanceId, context) {
    const event = this.activeEvents.get(instanceId);
    
    if (!event) {
      return false;
    }
    
    // Завершаем событие
    event.conclude(context);
    
    // Удаляем из активных событий
    this.activeEvents.delete(instanceId);
    
    return true;
  }
  
  /**
   * Сбрасывает кулдаун для события
   * @param {string} eventId - ID события
   * @returns {boolean} Успешность сброса кулдауна
   */
  resetCooldown(eventId) {
    if (!this.eventCooldowns.has(eventId)) {
      return false;
    }
    
    this.eventCooldowns.delete(eventId);
    return true;
  }
  
  /**
   * Проверяет, наступило ли второе время после первого
   * @param {Object} time1 - Первое время
   * @param {Object} time2 - Второе время
   * @returns {boolean} true, если time1 после time2
   */
  isTimeAfter(time1, time2) {
    // Упрощенная проверка, только часы и минуты
    if (time1.hour > time2.hour) return true;
    if (time1.hour === time2.hour && time1.minute >= time2.minute) return true;
    return false;
  }
  
  /**
   * Вычисляет разницу между двумя временами в минутах
   * @param {Object} time1 - Первое время
   * @param {Object} time2 - Второе время
   * @returns {number} Разница в минутах
   */
  getTimeDifferenceInMinutes(time1, time2) {
    const t1Minutes = time1.hour * 60 + time1.minute;
    const t2Minutes = time2.hour * 60 + time2.minute;
    return Math.abs(t2Minutes - t1Minutes);
  }
  
  /**
   * Вычисляет время через указанное количество дней
   * @param {Object} startTime - Начальное время
   * @param {number} days - Количество дней
   * @returns {Object} Новое время
   */
  calculateTimeAfterDays(startTime, days) {
    // В реальной реализации нужно учитывать календарь
    // Это упрощенная версия для прототипа
    const endTime = { ...startTime };
    // Предполагаем, что у нас есть поле day в объекте времени
    if (endTime.day !== undefined) {
      endTime.day += days;
    }
    return endTime;
  }
}
