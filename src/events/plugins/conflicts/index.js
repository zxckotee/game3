/**
 * Conflicts Events Plugin
 * Плагин с событиями глобальных конфликтов для системы случайных событий
 */

import { BanditAttackEvent } from './BanditAttackEvent';
import { DemonicCultivatorEvent } from './DemonicCultivatorEvent';
// Импорты для будущих типов конфликтов
// import { AncientCreatureEvent } from './AncientCreatureEvent';
// import { DimensionalBreachEvent } from './DimensionalBreachEvent';
// import { SectConflictEvent } from './SectConflictEvent';

/**
 * Плагин системы глобальных конфликтов
 */
const ConflictsEventsPlugin = {
  id: 'conflicts_events',
  name: 'Глобальные конфликты',
  description: 'Плагин с событиями глобальных конфликтов различных масштабов, влияющих на игровой мир и предоставляющих уникальные испытания игроку',
  version: '1.0.0',
  
  // Список всех классов событий в этом плагине
  events: [
    BanditAttackEvent,
    DemonicCultivatorEvent,
    // Будущие типы конфликтов (будут добавлены позже)
    // AncientCreatureEvent,
    // DimensionalBreachEvent,
    // SectConflictEvent
  ],
  
  // Метаданные конфликтов
  conflictMetadata: {
    // Масштабы конфликтов
    scales: [
      {
        id: 'local',
        name: 'Локальный',
        description: 'Конфликт, затрагивающий небольшую территорию, например, одну деревню или городок',
        duration: { min: 24, max: 48 }, // Часы игрового времени
        rewardMultiplier: 1.0
      },
      {
        id: 'regional',
        name: 'Региональный',
        description: 'Конфликт, затрагивающий целый регион',
        duration: { min: 72, max: 120 }, // Часы игрового времени
        rewardMultiplier: 2.5
      },
      {
        id: 'global',
        name: 'Глобальный',
        description: 'Конфликт, затрагивающий весь игровой мир, крайне опасный и редкий',
        duration: { min: 168, max: 336 }, // Часы игрового времени
        rewardMultiplier: 5.0
      }
    ],
    
    // Глобальные настройки системы конфликтов
    settings: {
      // Максимальное количество активных конфликтов разных масштабов
      maxActiveConflicts: {
        local: 3,
        regional: 2,
        global: 1
      },
      
      // Базовые шансы появления конфликтов в спокойные времена
      baseSpawnChance: {
        local: 0.05, // 5% шанс за игровой день
        regional: 0.02, // 2% шанс за игровой день
        global: 0.005 // 0.5% шанс за игровой день
      },
      
      // Минимальное время между конфликтами одного типа (в игровых днях)
      cooldowns: {
        local: 3, // 3 игровых дня
        regional: 7, // 7 игровых дней
        global: 14 // 14 игровых дней
      },
      
      // Множители для различных факторов влияния на появление конфликтов
      influenceMultipliers: {
        playerLevel: 0.02, // +2% за каждый уровень игрока выше требуемого
        regionTension: 0.5, // Множитель для напряженности региона (0-1)
        worldPhase: { // Множители для фаз мира
          peace: 0.5, // Мир
          tension: 1.0, // Напряженность
          conflict: 2.0, // Конфликт
          war: 3.0, // Война
          aftermath: 1.5 // Последствия
        }
      }
    }
  },
  
  /**
   * Функция инициализации плагина
   * @param {Object} eventManager - Менеджер событий
   */
  initialize: function(eventManager) {
    // Регистрация всех событий конфликтов
    this.events.forEach(EventClass => {
      eventManager.registerEvent(new EventClass());
    });
    
    console.log(`[Conflicts Plugin] Инициализировано ${this.events.length} типов глобальных конфликтов`);
  },
  
  /**
   * Функция для проверки условий появления конфликтов
   * Вызывается менеджером событий при обновлении игрового мира
   * @param {Object} gameState - Текущее состояние игры
   * @returns {Array} - Массив данных о возможных новых конфликтах
   */
  checkConflictConditions: function(gameState) {
    const possibleConflicts = [];
    
    // Текущая фаза мира (в реальной реализации будет определяться из gameState)
    const worldPhase = gameState.world.phase || 'peace';
    
    // Для каждого масштаба конфликтов
    this.conflictMetadata.scales.forEach(scale => {
      // Пропускаем проверку, если достигнут максимум активных конфликтов данного масштаба
      const activeConflictsOfScale = (gameState.events.activeEvents || [])
        .filter(event => event.scale === scale.id)
        .length;
        
      if (activeConflictsOfScale >= this.conflictMetadata.settings.maxActiveConflicts[scale.id]) {
        return; // Пропускаем этот масштаб
      }
      
      // Базовый шанс появления конфликта этого масштаба
      let spawnChance = this.conflictMetadata.settings.baseSpawnChance[scale.id];
      
      // Модификаторы шанса появления
      // Множитель от уровня игрока (чем выше уровень, тем выше шанс)
      spawnChance *= (1 + (gameState.player.level - 1) * this.conflictMetadata.settings.influenceMultipliers.playerLevel);
      
      // Множитель от фазы мира
      spawnChance *= this.conflictMetadata.settings.influenceMultipliers.worldPhase[worldPhase];
      
      // Проверяем, не на кулдауне ли конфликты этого масштаба
      const lastConflictOfScale = (gameState.events.completedEvents || [])
        .filter(event => event.scale === scale.id)
        .sort((a, b) => b.completedAt - a.completedAt)[0]; // Последний завершенный конфликт
        
      const cooldownDays = this.conflictMetadata.settings.cooldowns[scale.id];
      const cooldownTime = cooldownDays * 24 * 60; // В игровых минутах
      
      if (lastConflictOfScale && 
          (gameState.world.time.totalMinutes - lastConflictOfScale.completedAt) < cooldownTime) {
        return; // Пропускаем этот масштаб, так как он на кулдауне
      }
      
      // Если проверка вероятности успешна, добавляем этот масштаб в список возможных конфликтов
      if (Math.random() < spawnChance) {
        possibleConflicts.push({
          scale: scale.id,
          locations: this.selectPotentialLocations(gameState, scale.id)
        });
      }
    });
    
    return possibleConflicts;
  },
  
  /**
   * Выбор потенциальных локаций для конфликта
   * @param {Object} gameState - Текущее состояние игры
   * @param {string} scale - Масштаб конфликта
   * @returns {Array} - Массив данных о потенциальных локациях
   */
  selectPotentialLocations: function(gameState, scale) {
    // В реальной реализации здесь будет логика выбора локаций
    // на основе напряженности регионов, близости к игроку и т.д.
    
    // Заглушка для примера
    return [
      { id: 'forest_1', name: 'Темный лес', suitability: 0.8 },
      { id: 'mountain_valley', name: 'Горная долина', suitability: 0.7 },
      { id: 'village_east', name: 'Восточная деревня', suitability: 0.9 }
    ];
  }
};

export default ConflictsEventsPlugin;
