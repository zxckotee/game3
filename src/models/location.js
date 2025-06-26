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
    this.weatherModifiers = data.weatherModifiers || {};
    
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
   * @param {Object} weather - Текущая погода
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
    
    // Учитываем взаимодействие погоды и локации для особых эффектов
    if (weather && weather.currentWeather) {
      const weatherType = weather.currentWeather;
      const seasonType = weather.currentSeason;
      
      // Проверяем особые комбинации погоды и локации
      const weatherLocationCombos = {
        // Дождь в лесу
        'rain_spirit_forest': {
          description: 'Дождь в Духовном Лесу',
          effects: [
            { type: 'cultivation_bonus', modifier: 15 },
            { type: 'resource_bonus', target: 'herbs', modifier: 30 }
          ]
        },
        // Гроза в горах
        'thunderstorm_fire_mountain': {
          description: 'Гроза на Огненной Горе',
          effects: [
            { type: 'element_cultivation', element: 'lightning', modifier: 35 },
            { type: 'special_encounter', chance: 0.1, encounter: 'lightning_phoenix' }
          ]
        },
        // Ясная погода на равнинах
        'clear_wind_plains': {
          description: 'Ясный день на Равнинах Ветров',
          effects: [
            { type: 'movement_speed', modifier: 25 },
            { type: 'perception', modifier: 20 }
          ]
        },
        // Снег в ледяных пиках
        'snow_frozen_peaks': {
          description: 'Снегопад на Ледяных Пиках',
          effects: [
            { type: 'element_cultivation', element: 'water', modifier: 50 },
            { type: 'special_resource', resource: 'frost_essence' }
          ]
        },
        // Туман у озера
        'fog_lake_of_reflections': {
          description: 'Туман на Озере Отражений',
          effects: [
            { type: 'stealth', modifier: 40 },
            { type: 'cultivation_insight', chance: 0.15 }
          ]
        }
      };
      
      // Ключ для проверки особой комбинации
      const comboKey = `${weatherType}_${this.id}`;
      
      // Если есть особая комбинация, применяем её эффекты
      if (weatherLocationCombos[comboKey]) {
        const combo = weatherLocationCombos[comboKey];
        for (const effect of combo.effects) {
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
            case 'perception':
              modifiers.perception *= (1 + effect.modifier / 100);
              break;
            case 'element_cultivation':
              if (effect.element && effect.modifier) {
                modifiers.elementalCultivation[effect.element] = (modifiers.elementalCultivation[effect.element] || 1.0) * (1 + effect.modifier / 100);
              }
              break;
            case 'special_resource':
              modifiers.specialResources = modifiers.specialResources || [];
              modifiers.specialResources.push(effect.resource);
              break;
            case 'stealth':
              modifiers.stealth = (modifiers.stealth || 1.0) * (1 + effect.modifier / 100);
              break;
            case 'cultivation_insight':
              modifiers.cultivationInsight = (modifiers.cultivationInsight || 0) + effect.chance;
              break;
          }
        }
        
        // Сохраняем информацию о текущей особой комбинации
        modifiers.specialCombination = {
          id: comboKey,
          description: combo.description
        };
      }
      
      // Проверяем комбинации сезона и локации
      const seasonLocationCombos = {
        // Весна в лесу
        'spring_spirit_forest': {
          description: 'Весна в Духовном Лесу',
          effects: [
            { type: 'resource_bonus', target: 'herbs', modifier: 50 },
            { type: 'special_resource', resource: 'spirit_blossom' }
          ]
        },
        // Лето в горах
        'summer_fire_mountain': {
          description: 'Лето на Огненной Горе',
          effects: [
            { type: 'element_cultivation', element: 'fire', modifier: 50 },
            { type: 'movement_penalty', modifier: -15 } // Жарко, сложнее двигаться
          ]
        },
        // Осень на равнинах
        'autumn_wind_plains': {
          description: 'Осень на Равнинах Ветров',
          effects: [
            { type: 'element_cultivation', element: 'wind', modifier: 30 },
            { type: 'movement_speed', modifier: 20 }
          ]
        },
        // Зима в ледяных пиках
        'winter_frozen_peaks': {
          description: 'Зима на Ледяных Пиках',
          effects: [
            { type: 'element_cultivation', element: 'water', modifier: 60 },
            { type: 'movement_penalty', modifier: -30 },
            { type: 'special_resource', resource: 'eternal_ice' }
          ]
        }
      };
      
      // Ключ для проверки комбинации сезона и локации
      const seasonComboKey = `${seasonType}_${this.id}`;
      
      // Если есть особая комбинация сезона и локации, применяем её эффекты
      if (seasonLocationCombos[seasonComboKey]) {
        const combo = seasonLocationCombos[seasonComboKey];
        for (const effect of combo.effects) {
          switch (effect.type) {
            case 'resource_bonus':
              modifiers.resourceGathering[effect.target] = (modifiers.resourceGathering[effect.target] || 1.0) * (1 + effect.modifier / 100);
              break;
            case 'element_cultivation':
              if (effect.element && effect.modifier) {
                modifiers.elementalCultivation[effect.element] = (modifiers.elementalCultivation[effect.element] || 1.0) * (1 + effect.modifier / 100);
              }
              break;
            case 'movement_speed':
            case 'movement_penalty':
              modifiers.movement *= (1 + effect.modifier / 100);
              break;
            case 'special_resource':
              modifiers.specialResources = modifiers.specialResources || [];
              modifiers.specialResources.push(effect.resource);
              break;
          }
        }
        
        // Сохраняем информацию о текущей особой комбинации сезона
        modifiers.specialSeasonCombination = {
          id: seasonComboKey,
          description: combo.description
        };
      }
    }
    
    return modifiers;
  }
  
  /**
   * Получение визуальных эффектов для локации
   * @param {Object} weather - Текущая погода
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
    
    // Если есть погода, проверяем особые комбинации локации и погоды
    if (weather && weather.currentWeather) {
      const comboKey = `${weather.currentWeather}_${this.id}`;
      
      // Особые визуальные эффекты для комбинаций погоды и локации
      const specialVisualEffects = {
        'rain_spirit_forest': {
          filter: 'saturate(1.3) brightness(0.85) contrast(1.1)',
          overlay: 'misty_rain',
          animations: ['gentle_leaf_movement']
        },
        'thunderstorm_fire_mountain': {
          filter: 'contrast(1.4) brightness(0.7) saturate(1.2)',
          animations: ['lightning_flash', 'smoke_rise']
        },
        'fog_lake_of_reflections': {
          filter: 'brightness(0.9) contrast(0.9) saturate(0.7)',
          overlay: 'thick_mist',
          animations: ['water_ripple']
        },
        'snow_frozen_peaks': {
          filter: 'brightness(1.4) contrast(1.2) saturate(0.7)',
          overlay: 'snow_particles',
          animations: ['blizzard']
        }
      };
      
      if (specialVisualEffects[comboKey]) {
        const special = specialVisualEffects[comboKey];
        if (special.filter) effects.filter = special.filter;
        if (special.overlay) effects.overlay = special.overlay;
        if (special.animations) effects.animations = [...effects.animations, ...special.animations];
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
