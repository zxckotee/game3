/**
 * SpiritualRainEvent.js
 * Событие "Дождь духовного нектара"
 */

import { AbstractEvent } from '../../core/AbstractEvent';

export class SpiritualRainEvent extends AbstractEvent {
  constructor() {
    super({
      id: 'nature_spiritual_rain',
      name: 'Дождь духовного нектара',
      description: 'Особый дождь, насыщенный духовной энергией, который ускоряет рост растений и повышает качество трав.',
      category: 'nature',
      rarity: 'rare',
      duration: { min: 120, max: 360 }, // от 2 до 6 часов игрового времени
      conditions: {
        minLevel: 3,
        seasonModifiers: { spring: 1.5, summer: 1.2, autumn: 0.8, winter: 0.2 },
        timeModifiers: { dawn: 1.3, morning: 1.2, noon: 1.0, afternoon: 1.1, evening: 0.9, night: 0.7, deepNight: 0.5 },
        weatherModifiers: { clear: 0.3, cloudy: 1.5, rain: 2.0, storm: 1.0, fog: 0.8, snow: 0.1 },
        locationModifiers: { mountains: 0.8, plains: 1.2, forest: 1.5, city: 0.5, valley: 1.4, lake: 1.3 }
      },
      effects: [
        { type: 'plant_growth', value: 2.0, description: 'Ускорение роста растений в 2 раза' },
        { type: 'herb_quality', value: 1.5, description: 'Повышение качества собираемых трав на 50%' }
      ],
      choices: [
        {
          text: 'Собирать травы под нектарным дождем',
          requirements: null,
          results: [
            { 
              type: 'herb_collection', 
              quality: 1.5, 
              quantity: 1.5, 
              description: 'Собранные травы имеют повышенное качество и количество' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Расставить сосуды для сбора нектара',
          requirements: { skill: 'alchemy', level: 3 },
          results: [
            { 
              type: 'item', 
              item: 'spiritual_nectar', 
              amount: { min: 2, max: 5 }, 
              description: 'Собран духовный нектар для алхимических рецептов' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Медитировать под дождем для очищения духа',
          requirements: null,
          results: [
            { type: 'experience', amount: 30, description: '+30 опыта культивации' },
            { type: 'resource', resource: 'energy', amount: 35, description: '+35 единиц духовной энергии' }
          ],
          concludesEvent: false
        },
        {
          text: 'Укрыться от дождя и переждать',
          requirements: null,
          results: [],
          concludesEvent: true
        }
      ],
      cooldown: 14 // дней игрового времени
    });
  }
  
  /**
   * Применяет начальные эффекты события
   * @param {Object} context - Игровой контекст
   */
  applyInitialEffects(context) {
    // Добавляем временные баффы
    const buffId = `spiritual_rain_${Date.now()}`;
    const duration = this._endTime.hour * 60 + this._endTime.minute - (this._startTime.hour * 60 + this._startTime.minute);
    
    const buff = {
      id: buffId,
      name: 'Духовный нектар',
      description: 'Повышенная эффективность сбора трав и растений',
      duration: duration,
      startTime: { ...this._startTime },
      effects: {
        herbGatheringEfficiency: 2.0,
        herbQuality: 1.5
      }
    };
    
    // Добавляем бафф в состояние игрока
    if (context.player.buffs) {
      context.player.buffs[buffId] = buff;
    } else {
      console.warn('Невозможно применить бафф: отсутствует система баффов');
    }
    
    // Создаем визуальный эффект дождя
    if (context.world.visualEffects) {
      context.world.visualEffects.push({
        type: 'rain',
        intensity: 0.6,
        duration: duration,
        color: '#9AD0EC', // Голубоватый оттенок для духовного дождя
        particles: 'nectar'
      });
    }
    
    // Увеличиваем эффективность роста растений в регионе
    if (context.world.regions && context.player.location && context.player.location.regionId) {
      const region = context.world.regions[context.player.location.regionId];
      if (region && region.resources) {
        region.resources.plantGrowthRate = (region.resources.plantGrowthRate || 1.0) * 2.0;
        region.resources.herbQualityModifier = (region.resources.herbQualityModifier || 1.0) * 1.5;
      }
    }
  }
  
  /**
   * Метод, вызываемый при завершении события
   * @param {Object} context - Игровой контекст
   */
  onConclude(context) {
    // Удаляем баффы, связанные с этим событием
    const buffPrefix = 'spiritual_rain_';
    if (context.player.buffs) {
      for (const buffId in context.player.buffs) {
        if (buffId.startsWith(buffPrefix)) {
          delete context.player.buffs[buffId];
        }
      }
    }
    
    // Удаляем визуальные эффекты
    if (context.world.visualEffects) {
      context.world.visualEffects = context.world.visualEffects.filter(effect => effect.type !== 'rain' || effect.particles !== 'nectar');
    }
    
    // Восстанавливаем нормальную скорость роста растений в регионе
    if (context.world.regions && context.player.location && context.player.location.regionId) {
      const region = context.world.regions[context.player.location.regionId];
      if (region && region.resources) {
        region.resources.plantGrowthRate = region.resources.plantGrowthRate / 2.0;
        region.resources.herbQualityModifier = region.resources.herbQualityModifier / 1.5;
      }
    }
  }
  
  /**
   * Применяет конкретный результат
   * @param {Object} result - Результат для применения
   * @param {Object} context - Игровой контекст
   * @returns {Object} Информация о примененном результате
   */
  applyResult(result, context) {
    // Обработка сбора трав
    if (result.type === 'herb_collection') {
      const herbs = this.collectHerbs(context, result.quality, result.quantity);
      
      return {
        applied: herbs.length > 0,
        description: herbs.length > 0 
          ? `Собрано ${herbs.length} видов трав повышенного качества`
          : 'Не удалось собрать травы',
        herbs: herbs
      };
    }
    
    // Обработка сбора духовного нектара
    if (result.type === 'item' && result.item === 'spiritual_nectar') {
      // Генерируем случайное количество в заданном диапазоне
      const amount = Math.floor(result.amount.min + Math.random() * (result.amount.max - result.amount.min + 1));
      
      // Добавляем предметы в инвентарь
      if (context.player.inventory && context.player.inventory.items) {
        // Находим существующий предмет или создаем новый
        let existingItem = context.player.inventory.items.find(item => item.id === 'spiritual_nectar');
        
        if (existingItem) {
          existingItem.quantity += amount;
        } else {
          context.player.inventory.items.push({
            id: 'spiritual_nectar',
            name: 'Духовный нектар',
            description: 'Редкая жидкость, насыщенная духовной энергией, используется в продвинутой алхимии',
            type: 'material',
            rarity: 'rare',
            quantity: amount
          });
        }
        
        return {
          applied: true,
          description: `Собрано ${amount} единиц духовного нектара`,
          item: 'spiritual_nectar',
          amount: amount
        };
      }
      
      return { applied: false, description: 'Инвентарь не найден' };
    }
    
    // Для остальных типов используем реализацию родительского класса
    return super.applyResult(result, context);
  }
  
  /**
   * Собирает травы с учетом модификаторов качества и количества
   * @param {Object} context - Игровой контекст
   * @param {number} qualityMod - Модификатор качества трав
   * @param {number} quantityMod - Модификатор количества трав
   * @returns {Array} Массив собранных трав
   */
  collectHerbs(context, qualityMod, quantityMod) {
    // Этот метод должен быть реализован в соответствии с системой сбора трав в игре
    // Здесь приведена упрощенная демо-реализация
    
    // Список возможных трав в данном регионе
    const availableHerbs = [
      { id: 'spirit_grass', name: 'Духовная трава', baseRarity: 'common', quality: 1 },
      { id: 'cloud_flower', name: 'Облачный цветок', baseRarity: 'uncommon', quality: 2 },
      { id: 'moon_leaf', name: 'Лунный лист', baseRarity: 'rare', quality: 3 },
      { id: 'dragon_herb', name: 'Драконья трава', baseRarity: 'epic', quality: 4 }
    ];
    
    // Определяем, какие травы игрок может собрать в зависимости от уровня
    let availableForLevel = availableHerbs.filter(herb => {
      if (herb.baseRarity === 'common') return true;
      if (herb.baseRarity === 'uncommon' && context.player.cultivation.level >= 2) return true;
      if (herb.baseRarity === 'rare' && context.player.cultivation.level >= 5) return true;
      if (herb.baseRarity === 'epic' && context.player.cultivation.level >= 10) return true;
      return false;
    });
    
    // Определяем количество трав, которые игрок соберет
    const baseCount = Math.floor(1 + (context.player.cultivation.level / 5));
    const modifiedCount = Math.floor(baseCount * quantityMod);
    const actualCount = Math.min(modifiedCount, availableForLevel.length);
    
    // Выбираем случайные травы из доступных
    const collectedHerbs = [];
    
    // Создаем копию массива для случайного выбора
    const herbsForSelection = [...availableForLevel];
    
    for (let i = 0; i < actualCount; i++) {
      if (herbsForSelection.length === 0) break;
      
      // Выбираем случайную траву
      const randomIndex = Math.floor(Math.random() * herbsForSelection.length);
      const selectedHerb = herbsForSelection.splice(randomIndex, 1)[0];
      
      // Улучшаем качество травы
      const modifiedQuality = Math.floor(selectedHerb.quality * qualityMod);
      
      // Определяем количество собранной травы
      const baseQuantity = Math.floor(1 + Math.random() * 3); // от 1 до 3
      const modifiedQuantity = Math.floor(baseQuantity * quantityMod);
      
      // Добавляем траву в инвентарь
      if (context.player.inventory && context.player.inventory.items) {
        // Находим существующий предмет или создаем новый
        let existingItem = context.player.inventory.items.find(item => item.id === selectedHerb.id);
        
        if (existingItem) {
          existingItem.quantity += modifiedQuantity;
          existingItem.quality = Math.max(existingItem.quality, modifiedQuality); // Обновляем качество, если новое выше
        } else {
          context.player.inventory.items.push({
            id: selectedHerb.id,
            name: selectedHerb.name,
            description: `Трава, собранная во время духовного дождя. Качество: ${modifiedQuality}`,
            type: 'herb',
            rarity: selectedHerb.baseRarity,
            quality: modifiedQuality,
            quantity: modifiedQuantity
          });
        }
        
        // Добавляем информацию о собранной траве
        collectedHerbs.push({
          id: selectedHerb.id,
          name: selectedHerb.name,
          quality: modifiedQuality,
          quantity: modifiedQuantity
        });
      }
    }
    
    return collectedHerbs;
  }
}
