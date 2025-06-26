/**
 * GlobalConflictEvent.js
 * Базовый класс для всех событий глобальных конфликтов
 */

import { AbstractEvent } from '../../core/AbstractEvent';

/**
 * Базовый класс для всех глобальных конфликтов
 * Расширяет базовый класс событий и добавляет специфичные для конфликтов функции
 */
class GlobalConflictEvent extends AbstractEvent {
  /**
   * Конструктор события глобального конфликта
   * @param {Object} config - Конфигурация события
   * @param {string} config.id - Уникальный идентификатор события
   * @param {string} config.name - Название события
   * @param {string} config.description - Описание события
   * @param {number} config.minPlayerLevel - Минимальный уровень игрока для активации
   * @param {Array<string>} config.scaleTypes - Возможные масштабы конфликта (local, regional, global)
   * @param {string} config.defaultScale - Масштаб по умолчанию
   * @param {Array<string>} config.affectedFactions - Фракции, затронутые конфликтом
   */
  constructor(config) {
    super(config);
    
    this.scaleTypes = config.scaleTypes || ['local', 'regional', 'global'];
    this.defaultScale = config.defaultScale || 'local';
    this.affectedFactions = config.affectedFactions || [];
    this.duration = config.duration || {
      local: 1 * 24 * 60, // 1 день в игровых минутах
      regional: 3 * 24 * 60, // 3 дня в игровых минутах
      global: 7 * 24 * 60 // 7 дней в игровых минутах
    };
  }
  
  /**
   * Метод проверки возможности активации события
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} eventContext - Контекст события (локация, триггер)
   * @returns {boolean} - Может ли событие быть активировано
   */
  canActivate(gameState, eventContext) {
    // Базовая проверка из родительского класса
    if (!super.canActivate(gameState, eventContext)) {
      return false;
    }
    
    // Проверка специфичная для конфликтов
    const { location, scale } = eventContext;
    
    // Проверка допустимости масштаба
    if (scale && !this.scaleTypes.includes(scale)) {
      return false;
    }
    
    // Проверка наличия других активных конфликтов того же типа в той же локации
    const activeConflicts = gameState.events.activeEvents || [];
    const sameTypeConflicts = activeConflicts.filter(event => 
      event.type === this.id && 
      event.location === location
    );
    
    // Если уже есть конфликт того же типа в той же локации, не активируем новый
    if (sameTypeConflicts.length > 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Получение силы противников в зависимости от масштаба конфликта
   * @param {string} scale - Масштаб конфликта (local, regional, global)
   * @param {number} playerLevel - Уровень игрока
   * @returns {number} - Базовая сила группы противников
   */
  getEnemyPowerByScale(scale, playerLevel) {
    const baseMultiplier = {
      'local': 1,
      'regional': 1.5,
      'global': 2.5
    }[scale] || 1;
    
    // Базовая формула: уровень игрока * множитель масштаба + небольшой случайный разброс
    return Math.floor(playerLevel * baseMultiplier * (0.9 + Math.random() * 0.3));
  }
  
  /**
   * Генерация группы противников для конфликта
   * @param {number} power - Общая сила группы противников
   * @returns {Array} - Массив объектов противников
   */
  generateEnemyGroup(power) {
    // Реализация зависит от конкретного типа конфликта
    // Здесь базовый шаблон
    return [
      {
        id: 'enemy_1',
        name: 'Противник 1',
        level: Math.floor(power * 0.8),
        health: power * 10,
        damage: power * 2
      }
    ];
  }
  
  /**
   * Расчет наград в зависимости от масштаба конфликта
   * @param {string} scale - Масштаб конфликта
   * @param {number} playerLevel - Уровень игрока
   * @returns {Object} - Объект с наградами
   */
  calculateRewards(scale, playerLevel) {
    const scaleMultiplier = {
      'local': 1,
      'regional': 2.5,
      'global': 5
    }[scale] || 1;
    
    // Базовые формулы для различных типов наград
    return {
      experience: Math.floor(50 * playerLevel * scaleMultiplier),
      gold: Math.floor(100 * playerLevel * scaleMultiplier),
      reputation: Math.floor(5 * scaleMultiplier),
      items: [] // Предметы будут добавлены в зависимости от типа конфликта
    };
  }
  
  /**
   * Расчет времени истечения конфликта
   * @param {string} scale - Масштаб конфликта
   * @returns {number} - Время в игровых минутах
   */
  calculateExpirationTime(scale) {
    const baseDuration = this.duration[scale] || this.duration.local;
    // Добавляем случайное отклонение ±20%
    const randomFactor = 0.8 + Math.random() * 0.4; 
    return Math.floor(baseDuration * randomFactor);
  }
  
  /**
   * Получение доступных вариантов действий для игрока
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} location - Текущая локация
   * @returns {Array} - Массив доступных действий
   */
  getAvailableChoices(gameState, location) {
    // Базовые действия, доступные для всех конфликтов
    return [
      {
        id: 'engage',
        name: 'Вступить в бой',
        description: 'Вступить в прямое столкновение с противниками',
        requirementsMet: true
      },
      {
        id: 'avoid',
        name: 'Избежать конфликта',
        description: 'Попытаться обойти конфликт стороной',
        requirementsMet: true
      }
    ];
  }
  
  /**
   * Обработка выбора игрока
   * @param {string} choiceId - Идентификатор выбранного действия
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} eventContext - Контекст события
   * @returns {Object} - Результат выбора
   */
  handleChoice(choiceId, gameState, eventContext) {
    // Реализация зависит от конкретного типа конфликта
    // Базовая реализация для общих действий
    switch(choiceId) {
      case 'engage':
        return {
          success: true,
          message: 'Вы решили вступить в бой!',
          combatInitiated: true,
          enemies: eventContext.enemyGroup,
          consequences: {
            // В случае победы
            victory: {
              rewards: eventContext.rewards,
              reputationChanges: this.calculateReputationChanges(gameState, 'victory')
            },
            // В случае поражения
            defeat: {
              penalties: this.calculatePenalties(gameState),
              reputationChanges: this.calculateReputationChanges(gameState, 'defeat')
            }
          }
        };
        
      case 'avoid':
        const avoidSuccess = Math.random() < 0.7; // 70% шанс успешно избежать
        
        if (avoidSuccess) {
          return {
            success: true,
            message: 'Вам удалось избежать конфликта, но это может иметь последствия в будущем.',
            escalationChance: eventContext.escalationChance * 1.5, // Увеличиваем шанс эскалации
            reputationChanges: this.calculateReputationChanges(gameState, 'avoid_success')
          };
        } else {
          return {
            success: false,
            message: 'Вам не удалось избежать конфликта. Противники заметили вас!',
            combatInitiated: true,
            enemies: eventContext.enemyGroup,
            // Противники получают преимущество внезапности
            combatModifiers: {
              enemyInitiativeBonus: 5,
              playerDamageReduction: 0.2
            },
            consequences: {
              victory: {
                rewards: eventContext.rewards,
                reputationChanges: this.calculateReputationChanges(gameState, 'victory')
              },
              defeat: {
                penalties: this.calculatePenalties(gameState),
                reputationChanges: this.calculateReputationChanges(gameState, 'defeat')
              }
            }
          };
        }
        
      default:
        return {
          success: false,
          message: 'Неизвестное действие. Конфликт продолжается.'
        };
    }
  }
  
  /**
   * Расчет изменений репутации в зависимости от исхода конфликта
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} outcome - Исход конфликта (victory, defeat, avoid_success и т.д.)
   * @returns {Object} - Изменения репутации для различных фракций
   */
  calculateReputationChanges(gameState, outcome) {
    const changes = {};
    
    // Реализация зависит от конкретного типа конфликта
    // Здесь базовый шаблон
    
    return changes;
  }
  
  /**
   * Расчет штрафов при поражении в конфликте
   * @param {Object} gameState - Текущее состояние игры
   * @returns {Object} - Штрафы за поражение
   */
  calculatePenalties(gameState) {
    // Базовые штрафы, могут быть переопределены в дочерних классах
    return {
      healthReduction: 0.5, // Уменьшение здоровья на 50%
      energyReduction: 0.3, // Уменьшение энергии на 30%
      goldLoss: Math.floor(gameState.player.inventory.currency.gold * 0.1) // Потеря 10% золота
    };
  }
  
  /**
   * Проверка возможности эскалации конфликта
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} eventContext - Контекст события
   * @returns {boolean} - Может ли конфликт эскалировать
   */
  canEscalate(gameState, eventContext) {
    const { scale, escalationChance } = eventContext;
    
    // Если текущий масштаб уже глобальный, эскалация невозможна
    if (scale === 'global') {
      return false;
    }
    
    // Определение следующего масштаба
    const currentScaleIndex = this.scaleTypes.indexOf(scale);
    const nextScale = this.scaleTypes[currentScaleIndex + 1];
    
    // Если следующего масштаба нет, эскалация невозможна
    if (!nextScale) {
      return false;
    }
    
    // Проверка вероятности эскалации
    return Math.random() < (escalationChance || 0.3);
  }
  
  /**
   * Эскалация конфликта на следующий уровень масштаба
   * @param {Object} gameState - Текущее состояние игры
   * @param {Object} eventContext - Контекст события
   * @returns {Object} - Новый контекст эскалированного конфликта
   */
  escalate(gameState, eventContext) {
    const { scale, location } = eventContext;
    
    // Определение следующего масштаба
    const currentScaleIndex = this.scaleTypes.indexOf(scale);
    const nextScale = this.scaleTypes[currentScaleIndex + 1];
    
    // Создание нового контекста для эскалированного конфликта
    const escalatedContext = {
      ...eventContext,
      scale: nextScale,
      message: `Конфликт эскалировал с ${scale} до ${nextScale} масштаба!`,
      enemyPower: this.getEnemyPowerByScale(nextScale, gameState.player.level),
      // Уменьшаем шанс дальнейшей эскалации
      escalationChance: (eventContext.escalationChance || 0.3) * 0.7
    };
    
    // Обновляем группу противников для нового масштаба
    escalatedContext.enemyGroup = this.generateEnemyGroup(escalatedContext.enemyPower);
    
    // Обновляем награды для нового масштаба
    escalatedContext.rewards = this.calculateRewards(nextScale, gameState.player.level);
    
    // Обновляем время истечения для нового масштаба
    escalatedContext.expirationTime = this.calculateExpirationTime(nextScale);
    
    return escalatedContext;
  }
}

export { GlobalConflictEvent };
