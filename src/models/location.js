/**
 * Модель локации с поддержкой погодных эффектов и бонусов
 */
class Location {
  /**
   * Создает объект локации
   * @param {Object} data - Данные локации
   */
  constructor(data = {}) {
    // Базовые данные
    this.id = data.id || '';
    this.name = data.name || 'Неизвестное место';
    this.description = data.description || '';
    
    // Координаты и размеры
    this.coordinates = data.coordinates || { x: 0, y: 0 };
    this.size = data.size || { width: 1, height: 1 };
    
    // Тип локации для визуальных эффектов
    this.type = data.type || 'default';
    
    // Модификаторы погоды (увеличивают или уменьшают вероятность определенной погоды)
    
    // Особые эффекты локации
    this.effects = data.effects || [];
    
    // Доступные ресурсы и их бонусы
    this.resources = data.resources || {};
    
    // Особенности локации (для описания)
    this.specialFeatures = data.specialFeatures || [];
    
    // Требования для доступа к локации
    this.requirements = data.requirements || null;
    
    // Уникальные свойства конкретной локации
    this.properties = data.properties || {};
  }
  
  /**
   * Возвращает модификаторы для игрока в данной локации
   * @param {Object} player - Объект игрока
   * @returns {Object} - Модификаторы для игрока
   */
  getPlayerModifiers(player, weather) {
    const modifiers = {
      cultivation: 1.0, // Базовый множитель культивации
      resourceGathering: {}, // Множители сбора ресурсов
      combatStats: {}, // Модификаторы боевых характеристик
      movement: 1.0, // Множитель скорости передвижения
      perception: 1.0, // Множитель восприятия
      energyRegen: 1.0, // Множитель восстановления энергии
      elementalCultivation: {} // Модификаторы стихийной культивации
    };
    
    // Применяем эффекты локации
    for (const effect of this.effects) {
      switch (effect.type) {
        case 'cultivation_bonus':
          modifiers.cultivation *= (1 + effect.modifier / 100);
          break;
        case 'resource_bonus':
          modifiers.resourceGathering[effect.target] = (modifiers.resourceGathering[effect.target] || 1.0) * (1 + effect.modifier / 100);
          break;
        case 'movement_speed':
          modifiers.movement *= (1 + effect.modifier / 100);
          break;
        case 'combat_damage':
          modifiers.combatStats.damage = (modifiers.combatStats.damage || 1.0) * (1 + effect.modifier / 100);
          break;
        case 'perception':
          modifiers.perception *= (1 + effect.modifier / 100);
          break;
        case 'energy_regen':
          modifiers.energyRegen *= (1 + effect.modifier / 100);
          break;
        case 'element_cultivation':
          if (effect.element && effect.modifier) {
            modifiers.elementalCultivation[effect.element] = (modifiers.elementalCultivation[effect.element] || 1.0) * (1 + effect.modifier / 100);
          }
          break;
        case 'special_resource':
          // Особые ресурсы доступны только в этой локации
          modifiers.specialResources = modifiers.specialResources || [];
          modifiers.specialResources.push(effect.resource);
          break;
      }
    }
    
      
    }
    
    return modifiers;
  }
  
  /**
   * Получение визуальных эффектов для локации
   * @returns {Object} - Визуальные эффекты (фильтры, анимации и т.д.)
   */
  getVisualEffects(weather) {
    const effects = {
      filter: 'none',
      overlay: null,
      background: null,
      animations: []
    };
    
    // Базовые эффекты в зависимости от типа локации
    switch (this.type) {
      case 'forest':
        effects.filter = 'saturate(1.2) brightness(0.9)';
        break;
      case 'mountain':
        effects.filter = 'contrast(1.1) brightness(1.05)';
        break;
      case 'lake':
        effects.filter = 'brightness(1.1) saturate(1.1) hue-rotate(10deg)';
        break;
      case 'plain':
        effects.filter = 'brightness(1.15) contrast(0.95)';
        break;
      case 'desert':
        effects.filter = 'brightness(1.2) saturate(0.9) sepia(0.2)';
        break;
      case 'snow':
        effects.filter = 'brightness(1.3) contrast(1.1) saturate(0.8)';
        break;
    }
    
    // Особые визуальные эффекты конкретной локации
    if (this.properties.visualEffects) {
      if (this.properties.visualEffects.filter) {
        effects.filter = this.properties.visualEffects.filter;
      }
      if (this.properties.visualEffects.overlay) {
        effects.overlay = this.properties.visualEffects.overlay;
      }
      if (this.properties.visualEffects.background) {
        effects.background = this.properties.visualEffects.background;
      }
      if (this.properties.visualEffects.animations && this.properties.visualEffects.animations.length > 0) {
        effects.animations = [...this.properties.visualEffects.animations];
      }
    }
    
    
    return effects;
  }
  
  /**
   * Проверяет, доступна ли локация для игрока
   * @param {Object} player - Объект игрока
   * @returns {Boolean} - true, если локация доступна
   */
  isAccessible(player) {
    if (!this.requirements) return true;
    
    // Проверяем требования к уровню культивации
    if (this.requirements.cultivation && player.cultivation) {
      if (this.requirements.cultivation.stage > player.cultivation.stage) {
        return false;
      }
      if (this.requirements.cultivation.level > player.cultivation.level) {
        return false;
      }
    }
    
    // Проверяем требования к характеристикам
    if (this.requirements.stats && player.stats) {
      for (const [stat, value] of Object.entries(this.requirements.stats)) {
        if (!player.stats[stat] || player.stats[stat] < value) {
          return false;
        }
      }
    }
    
    // Проверяем требования к наличию определенных предметов
    if (this.requirements.items && player.inventory) {
      for (const item of this.requirements.items) {
        const found = player.inventory.items.find(i => i.id === item.id && i.quantity >= (item.quantity || 1));
        if (!found) return false;
      }
    }
    
    // Проверяем требования к выполненным заданиям
    if (this.requirements.quests && player.quests) {
      for (const questId of this.requirements.quests) {
        const quest = player.quests.find(q => q.id === questId && q.completed);
        if (!quest) return false;
      }
    }
    
    return true;
  }
}

// Экспортируем класс локации
module.exports = Location;
