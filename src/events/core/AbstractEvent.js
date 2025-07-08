/**
 * AbstractEvent.js
 * Базовый класс для всех событий в игре "Путь к Бессмертию"
 */

export class AbstractEvent {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.name = config.name || 'Неизвестное событие';
    this.description = config.description || '';
    this.category = config.category || 'unknown';
    this.rarity = config.rarity || 'common';
    this.duration = config.duration || { min: 60, max: 120 }; // минуты игрового времени
    this.conditions = config.conditions || {};
    this.effects = config.effects || [];
    this.choices = config.choices || [];
    this.cooldown = config.cooldown || 7; // дней игрового времени
    
    // Внутренние свойства экземпляра
    this._startTime = null;
    this._endTime = null;
    this._isActive = false;
    this._selectedChoices = [];
    this._instanceId = null;
  }
  
  /**
   * Генерирует уникальный идентификатор события
   * @returns {string} Уникальный ID
   */
  generateId() {
    return `${this.constructor.name}_${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  
  /**
   * Проверяет, могут ли быть выполнены условия для активации события
   * @param {Object} context - Игровой контекст (состояние мира, игрока и т.д.)
   * @returns {boolean} Результат проверки условий
   */
  checkConditions(context) {
    // Проверка минимального уровня
    if (this.conditions.minLevel && context.player.cultivation.level < this.conditions.minLevel) {
      return false;
    }
    
    
    
    
    // Проверка модификаторов локации
    if (this.conditions.locationModifiers) {
      const currentLocation = context.player.location.type;
      const locationModifier = this.conditions.locationModifiers[currentLocation] || 1.0;
      if (Math.random() > locationModifier * this.getBaseChance()) {
        return false;
      }
    }
    
    // Дополнительные условия, которые могут быть переопределены в подклассах
    return this.additionalConditions(context);
  }
  
  /**
   * Дополнительные условия, которые могут быть переопределены
   * @param {Object} context - Игровой контекст
   * @returns {boolean} Результат проверки дополнительных условий
   */
  additionalConditions(context) {
    return true;
  }
  
  /**
   * Возвращает базовый шанс события в зависимости от редкости
   * @returns {number} Базовая вероятность события от 0 до 1
   */
  getBaseChance() {
    switch (this.rarity) {
      case 'common': return 0.1;
      case 'uncommon': return 0.05;
      case 'rare': return 0.02;
      case 'epic': return 0.005;
      case 'legendary': return 0.001;
      default: return 0.01;
    }
  }
  
  
  /**
   * Активирует событие
   * @param {Object} context - Игровой контекст
   * @returns {Object} Информация об активированном событии
   */
  activate(context) {
    this._isActive = true;
    this._instanceId = `${this.id}_${Date.now()}`;
    this._startTime = { ...context.world.time };
    
    // Вычисляем случайную длительность в пределах указанного диапазона
    const durationMinutes = Math.floor(
      this.duration.min + Math.random() * (this.duration.max - this.duration.min)
    );
    
    this._endTime = this.calculateEndTime(this._startTime, durationMinutes);
    
    // Применяем начальные эффекты события
    this.applyInitialEffects(context);
    
    return {
      instanceId: this._instanceId,
      name: this.name,
      description: this.description,
      startTime: this._startTime,
      endTime: this._endTime,
      choices: this.choices
    };
  }
  
  /**
   * Применяет начальные эффекты события
   * @param {Object} context - Игровой контекст
   */
  applyInitialEffects(context) {
    // Реализация в подклассах
  }
  
  /**
   * Обрабатывает выбор действия игрока
   * @param {number} choiceIndex - Индекс выбранного действия
   * @param {Object} context - Игровой контекст
   * @returns {Object} Результат выбора
   */
  processChoice(choiceIndex, context) {
    if (choiceIndex < 0 || choiceIndex >= this.choices.length) {
      return { success: false, message: 'Недопустимый выбор' };
    }
    
    const choice = this.choices[choiceIndex];
    this._selectedChoices.push(choiceIndex);
    
    // Проверяем требования для выбора
    if (choice.requirements && !this.checkRequirements(choice.requirements, context)) {
      return { success: false, message: 'Не выполнены требования для этого действия' };
    }
    
    // Применяем результаты выбора
    const results = this.applyChoiceResults(choice, context);
    
    // Проверяем, завершает ли выбор событие
    if (choice.concludesEvent) {
      this.conclude(context);
    }
    
    return {
      success: true,
      results,
      eventConcluded: choice.concludesEvent || false
    };
  }
  
  /**
   * Проверяет требования для выбора
   * @param {Object} requirements - Требования для выбора
   * @param {Object} context - Игровой контекст
   * @returns {boolean} Результат проверки требований
   */
  checkRequirements(requirements, context) {
    // Проверка требований (навыки, характеристики, предметы и т.д.)
    if (requirements.skill && context.player.skills) {
      const skill = context.player.skills[requirements.skill];
      if (!skill || skill.level < requirements.level) {
        return false;
      }
    }
    
    if (requirements.stat && context.player.stats) {
      const stat = context.player.stats[requirements.stat];
      if (!stat || stat < requirements.value) {
        return false;
      }
    }
    
    if (requirements.item && context.player.inventory) {
      const item = context.player.inventory.items.find(i => i.id === requirements.item);
      if (!item || item.quantity < (requirements.quantity || 1)) {
        return false;
      }
    }
    
    return true; // По умолчанию требования выполнены
  }
  
  /**
   * Применяет результаты выбора к контексту
   * @param {Object} choice - Выбранное действие
   * @param {Object} context - Игровой контекст
   * @returns {Array} Примененные результаты
   */
  applyChoiceResults(choice, context) {
    const appliedResults = [];
    
    if (choice.results) {
      for (const result of choice.results) {
        // Применяем результат в зависимости от его типа
        const appliedResult = this.applyResult(result, context);
        appliedResults.push(appliedResult);
      }
    }
    
    return appliedResults;
  }
  
  /**
   * Применяет конкретный результат
   * @param {Object} result - Результат для применения
   * @param {Object} context - Игровой контекст
   * @returns {Object} Информация о примененном результате
   */
  applyResult(result, context) {
    // Базовая реализация для разных типов результатов
    switch (result.type) {
      case 'resource':
        // Изменение ресурса (энергия, опыт, духовные камни и т.д.)
        if (result.resource === 'energy' && context.player.cultivation) {
          context.player.cultivation.energy += result.amount;
          return { 
            applied: true, 
            description: result.description,
            resource: 'energy',
            amount: result.amount,
            newValue: context.player.cultivation.energy
          };
        }
        return { applied: false, description: 'Ресурс не найден' };
        
      case 'experience':
        // Добавление опыта культивации
        if (context.player.cultivation) {
          context.player.cultivation.experience += result.amount;
          return { 
            applied: true, 
            description: result.description,
            amount: result.amount,
            newValue: context.player.cultivation.experience
          };
        }
        return { applied: false, description: 'Система культивации не найдена' };
        
      case 'item':
        // Добавление предмета в инвентарь
        if (context.player.inventory && context.player.inventory.items) {
          // В реализации нужно добавить логику для добавления предмета
          return { applied: true, description: result.description };
        }
        return { applied: false, description: 'Инвентарь не найден' };
        
      default:
        return { applied: false, description: 'Неизвестный тип результата' };
    }
  }
  
  /**
   * Вычисляет время окончания события
   * @param {Object} startTime - Время начала события
   * @param {number} durationMinutes - Длительность в минутах
   * @returns {Object} Время окончания события
   */
  
  /**
   * Проверяет, закончилось ли событие
   * @param {Object} currentTime - Текущее игровое время
   * @returns {boolean} true, если событие истекло
   */
  
  
  /**
   * Завершает событие
   * @param {Object} context - Игровой контекст
   * @returns {boolean} Результат завершения
   */
  conclude(context) {
    this._isActive = false;
    // Дополнительная логика завершения события
    this.onConclude(context);
    return true;
  }
  
  /**
   * Метод, вызываемый при завершении события
   * @param {Object} context - Игровой контекст
   */
  onConclude(context) {
    // Реализация в подклассах
  }
  
  /**
   * Возвращает текущее состояние события
   * @returns {Object} Состояние события
   */
  getState() {
    return {
      id: this.id,
      instanceId: this._instanceId,
      name: this.name,
      description: this.description,
      category: this.category,
      rarity: this.rarity,
      isActive: this._isActive,
      startTime: this._startTime,
      endTime: this._endTime,
      selectedChoices: this._selectedChoices
    };
  }
}
