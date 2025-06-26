/**
 * LunarPhaseEvent.js
 * Событие "Фаза луны"
 * Цикличное событие, отслеживающее фазы луны и их влияние на игровой мир
 */

import { AbstractEvent } from '../../core/AbstractEvent';

export class LunarPhaseEvent extends AbstractEvent {
  constructor() {
    super({
      id: 'cycle_lunar_phase',
      name: 'Фаза луны',
      description: 'Текущая фаза луны влияет на духовную энергию и различные аспекты мира.',
      category: 'cycle',
      rarity: 'common',
      duration: { min: 1440, max: 1440 }, // 24 часа игрового времени, полный день
      conditions: {
        minLevel: 1, // доступно с самого начала
        // Фазы луны происходят всегда, независимо от сезона, погоды или местоположения
        seasonModifiers: { spring: 1.0, summer: 1.0, autumn: 1.0, winter: 1.0 },
        timeModifiers: { dawn: 1.0, morning: 1.0, noon: 1.0, afternoon: 1.0, evening: 1.0, night: 1.0, deepNight: 1.0 },
        weatherModifiers: { clear: 1.0, cloudy: 1.0, rain: 1.0, storm: 1.0, fog: 1.0, snow: 1.0 },
        locationModifiers: { city: 1.0, town: 1.0, village: 1.0, plains: 1.0, forest: 1.0, mountains: 1.0 }
      },
      effects: [
        { type: 'lunar_influence', value: 1.0, description: 'Влияние лунного цикла на мир' }
      ],
      choices: [
        {
          text: 'Провести ритуал лунной медитации',
          requirements: { skill: 'meditation', level: 2 },
          results: [
            { 
              type: 'lunar_meditation', 
              phaseBonus: true,
              description: 'Медитация под влиянием лунной энергии' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Изучать лунные знамения',
          requirements: { stat: 'intellect', value: 3 },
          results: [
            { 
              type: 'lunar_divination', 
              description: 'Попытка предсказать будущие события по луне' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Собирать травы, усиленные лунным светом',
          requirements: null,
          results: [
            { 
              type: 'lunar_herb_gathering', 
              description: 'Сбор трав, чья сила изменяется в зависимости от фазы луны' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Игнорировать лунный цикл',
          requirements: null,
          results: [],
          concludesEvent: true
        }
      ],
      cooldown: 0 // Нет кулдауна, т.к. это циклическое событие
    });
    
    // Дополнительные свойства для лунного цикла
    this.lunarPhases = [
      { id: 'new_moon', name: 'Новолуние', dayOffset: 0, spiritualEnergyMod: 0.7, waterEnergyMod: 0.5, invisibilityMod: 1.5 },
      { id: 'waxing_crescent', name: 'Растущий серп', dayOffset: 3, spiritualEnergyMod: 0.8, waterEnergyMod: 0.7, growthMod: 1.2 },
      { id: 'first_quarter', name: 'Первая четверть', dayOffset: 7, spiritualEnergyMod: 0.9, waterEnergyMod: 0.9, balanceMod: 1.1 },
      { id: 'waxing_gibbous', name: 'Растущая луна', dayOffset: 10, spiritualEnergyMod: 1.1, waterEnergyMod: 1.1, growthMod: 1.3 },
      { id: 'full_moon', name: 'Полнолуние', dayOffset: 14, spiritualEnergyMod: 1.5, waterEnergyMod: 1.5, transformationMod: 1.5 },
      { id: 'waning_gibbous', name: 'Убывающая луна', dayOffset: 17, spiritualEnergyMod: 1.1, waterEnergyMod: 1.1, healingMod: 1.3 },
      { id: 'last_quarter', name: 'Последняя четверть', dayOffset: 21, spiritualEnergyMod: 0.9, waterEnergyMod: 0.9, balanceMod: 1.1 },
      { id: 'waning_crescent', name: 'Убывающий серп', dayOffset: 24, spiritualEnergyMod: 0.8, waterEnergyMod: 0.7, banishmentMod: 1.2 }
    ];
    
    this.currentPhase = null; // Текущая фаза луны, будет определена при активации
    this.lunarCycleLength = 28; // Полный цикл луны в днях
  }
  
  /**
   * Применяет начальные эффекты события
   * @param {Object} context - Игровой контекст
   */
  applyInitialEffects(context) {
    // Определяем текущую фазу луны на основе игровой даты
    this.currentPhase = this.determineCurrentPhase(context);
    
    // Применяем эффекты текущей фазы луны
    this.applyLunarPhaseEffects(context);
    
    // Добавляем информацию о луне в глобальный контекст
    if (context.world.celestialBodies) {
      context.world.celestialBodies.moon = {
        phase: this.currentPhase.id,
        phaseName: this.currentPhase.name,
        spiritualEnergyMod: this.currentPhase.spiritualEnergyMod,
        nextPhaseIn: this.calculateDaysToNextPhase(context),
        fullCycleProgress: this.calculateLunarCycleProgress(context)
      };
    }
    
    // Добавляем визуальные эффекты луны
    if (context.world.visualEffects) {
      // Очищаем предыдущие лунные эффекты
      context.world.visualEffects = context.world.visualEffects.filter(effect => effect.type !== 'moon');
      
      // Добавляем новый эффект
      context.world.visualEffects.push({
        type: 'moon',
        phase: this.currentPhase.id,
        intensity: this.currentPhase.id === 'full_moon' ? 1.0 : 
                   this.currentPhase.id === 'new_moon' ? 0.1 : 0.5,
        duration: this._endTime.hour * 60 + this._endTime.minute - (this._startTime.hour * 60 + this._startTime.minute)
      });
    }
    
    // Оповещаем игрока о фазе луны через систему уведомлений
    if (context.ui && context.ui.notifications) {
      const isSpecialPhase = this.currentPhase.id === 'full_moon' || this.currentPhase.id === 'new_moon';
      
      if (isSpecialPhase) {
        context.ui.notifications.push({
          id: `lunar_phase_${Date.now()}`,
          message: `Наступила фаза "${this.currentPhase.name}". Влияние лунной энергии ${this.currentPhase.spiritualEnergyMod > 1.0 ? 'усиливается' : 'ослабевает'}.`,
          type: 'info',
          timestamp: { ...context.world.time }
        });
      }
    }
  }
  
  /**
   * Метод, вызываемый при завершении события
   * @param {Object} context - Игровой контекст
   */
  onConclude(context) {
    // Для цикличных событий это не означает удаление эффектов,
    // т.к. они будут обновлены при следующей активации
  }
  
  /**
   * Применяет конкретный результат
   * @param {Object} result - Результат для применения
   * @param {Object} context - Игровой контекст
   * @returns {Object} Информация о примененном результате
   */
  applyResult(result, context) {
    // Обработка лунной медитации
    if (result.type === 'lunar_meditation') {
      const meditationResult = this.processLunarMeditation(context);
      
      return {
        applied: true,
        description: meditationResult.description,
        energyGained: meditationResult.energyGained,
        experienceGained: meditationResult.experienceGained,
        insightGained: meditationResult.insightGained
      };
    }
    
    // Обработка предсказаний по луне
    if (result.type === 'lunar_divination') {
      const divinationResult = this.processLunarDivination(context);
      
      return {
        applied: true,
        description: divinationResult.description,
        predictions: divinationResult.predictions
      };
    }
    
    // Обработка сбора трав под луной
    if (result.type === 'lunar_herb_gathering') {
      const herbGatheringResult = this.processLunarHerbGathering(context);
      
      return {
        applied: true,
        description: herbGatheringResult.description,
        herbs: herbGatheringResult.herbs
      };
    }
    
    // Для остальных типов используем реализацию родительского класса
    return super.applyResult(result, context);
  }
  
  /**
   * Определяет текущую фазу луны на основе игровой даты
   * @param {Object} context - Игровой контекст
   * @returns {Object} Текущая фаза луны
   */
  determineCurrentPhase(context) {
    // Получаем текущий день игрового года
    const currentDay = (context.world.date?.day || 1) + 
                      ((context.world.date?.month || 1) - 1) * 30;
    
    // Вычисляем позицию в лунном цикле (0-27)
    const dayInCycle = currentDay % this.lunarCycleLength;
    
    // Находим подходящую фазу
    let currentPhase = this.lunarPhases[0];
    
    for (let i = 1; i < this.lunarPhases.length; i++) {
      if (dayInCycle >= this.lunarPhases[i].dayOffset) {
        currentPhase = this.lunarPhases[i];
      } else {
        break;
      }
    }
    
    return currentPhase;
  }
  
  /**
   * Вычисляет количество дней до следующей фазы луны
   * @param {Object} context - Игровой контекст
   * @returns {number} Количество дней до следующей фазы
   */
  calculateDaysToNextPhase(context) {
    // Получаем текущий день игрового года
    const currentDay = (context.world.date?.day || 1) + 
                      ((context.world.date?.month || 1) - 1) * 30;
    
    // Вычисляем день в лунном цикле (0-27)
    const dayInCycle = currentDay % this.lunarCycleLength;
    
    // Находим индекс текущей фазы
    const currentPhaseIndex = this.lunarPhases.findIndex(phase => phase.id === this.currentPhase.id);
    
    // Находим следующую фазу
    const nextPhaseIndex = (currentPhaseIndex + 1) % this.lunarPhases.length;
    const nextPhase = this.lunarPhases[nextPhaseIndex];
    
    // Вычисляем дни до следующей фазы
    let daysToNext;
    if (nextPhaseIndex > currentPhaseIndex) {
      // Следующая фаза в текущем цикле
      daysToNext = nextPhase.dayOffset - dayInCycle;
    } else {
      // Следующая фаза в новом цикле
      daysToNext = (this.lunarCycleLength - dayInCycle) + nextPhase.dayOffset;
    }
    
    return Math.max(1, daysToNext); // Минимум 1 день
  }
  
  /**
   * Вычисляет прогресс лунного цикла (0-1)
   * @param {Object} context - Игровой контекст
   * @returns {number} Прогресс цикла от 0 до 1
   */
  calculateLunarCycleProgress(context) {
    // Получаем текущий день игрового года
    const currentDay = (context.world.date?.day || 1) + 
                      ((context.world.date?.month || 1) - 1) * 30;
    
    // Вычисляем день в лунном цикле (0-27)
    const dayInCycle = currentDay % this.lunarCycleLength;
    
    // Возвращаем прогресс как значение от 0 до 1
    return dayInCycle / this.lunarCycleLength;
  }
  
  /**
   * Применяет эффекты текущей фазы луны к игровому миру
   * @param {Object} context - Игровой контекст
   */
  applyLunarPhaseEffects(context) {
    // Модификация скорости регенерации энергии
    if (context.player.cultivation) {
      context.player.cultivation.energyRegenModifiers = context.player.cultivation.energyRegenModifiers || {};
      context.player.cultivation.energyRegenModifiers.lunarPhase = this.currentPhase.spiritualEnergyMod;
    }
    
    // Модификация силы водных техник
    if (context.player.techniques) {
      // Для каждой техники проверяем, относится ли она к водной стихии
      for (const technique of Object.values(context.player.techniques)) {
        if (technique.element === 'water') {
          technique.temporaryModifiers = technique.temporaryModifiers || {};
          technique.temporaryModifiers.lunarPhase = this.currentPhase.waterEnergyMod;
        }
      }
    }
    
    // Специальные эффекты в зависимости от фазы
    switch (this.currentPhase.id) {
      case 'new_moon':
        // Новолуние - усиление скрытности и невидимости
        if (context.player.stats) {
          context.player.stats.temporaryModifiers = context.player.stats.temporaryModifiers || {};
          context.player.stats.temporaryModifiers.stealth = (context.player.stats.temporaryModifiers.stealth || 1.0) * this.currentPhase.invisibilityMod;
        }
        break;
        
      case 'waxing_crescent':
      case 'waxing_gibbous':
        // Растущая луна - ускорение роста растений
        if (context.world.regions && context.player.location && context.player.location.regionId) {
          const region = context.world.regions[context.player.location.regionId];
          if (region && region.resources) {
            region.resources.plantGrowthRate = (region.resources.plantGrowthRate || 1.0) * this.currentPhase.growthMod;
          }
        }
        break;
        
      case 'full_moon':
        // Полнолуние - усиление трансформационных процессов
        if (context.player.cultivation) {
          context.player.cultivation.breakthroughModifiers = context.player.cultivation.breakthroughModifiers || {};
          context.player.cultivation.breakthroughModifiers.lunarPhase = this.currentPhase.transformationMod;
        }
        
        // Увеличение шанса появления редких существ
        if (context.world.spawnRates) {
          context.world.spawnRates.rareCreatureModifier = (context.world.spawnRates.rareCreatureModifier || 1.0) * this.currentPhase.transformationMod;
        }
        break;
        
      case 'waning_gibbous':
        // Убывающая луна - усиление лечебных эффектов
        if (context.player.stats) {
          context.player.stats.temporaryModifiers = context.player.stats.temporaryModifiers || {};
          context.player.stats.temporaryModifiers.healing = (context.player.stats.temporaryModifiers.healing || 1.0) * this.currentPhase.healingMod;
        }
        break;
        
      case 'waning_crescent':
        // Убывающий серп - усиление эффектов изгнания
        if (context.player.techniques) {
          // Для каждой техники проверяем, относится ли она к изгнанию
          for (const technique of Object.values(context.player.techniques)) {
            if (technique.type === 'banishment' || technique.tags?.includes('banishment')) {
              technique.temporaryModifiers = technique.temporaryModifiers || {};
              technique.temporaryModifiers.lunarPhase = this.currentPhase.banishmentMod;
            }
          }
        }
        break;
    }
  }
  
  /**
   * Обрабатывает лунную медитацию
   * @param {Object} context - Игровой контекст
   * @returns {Object} Результат медитации
   */
  processLunarMeditation(context) {
    const playerLevel = context.player.cultivation.level;
    const meditationSkillLevel = context.player.skills?.meditation?.level || 1;
    
    // Базовое количество энергии зависит от уровня навыка медитации
    let energyGain = 20 * meditationSkillLevel;
    
    // Модификация в зависимости от фазы луны
    energyGain *= this.currentPhase.spiritualEnergyMod;
    
    // Базовый опыт культивации
    let experienceGain = 10 * meditationSkillLevel * this.currentPhase.spiritualEnergyMod;
    
    // Шанс получения прозрения
    const insightChance = 0.05 * meditationSkillLevel * this.currentPhase.spiritualEnergyMod;
    const insightGained = Math.random() < insightChance;
    
    // Применяем эффекты к игроку
    if (context.player.cultivation) {
      context.player.cultivation.energy = Math.min(
        context.player.cultivation.energy + energyGain,
        context.player.cultivation.maxEnergy
      );
      
      context.player.cultivation.experience += experienceGain;
    }
    
    // Если получено прозрение, добавляем эффект
    if (insightGained && context.player.insights) {
      context.player.insights.push({
        id: `lunar_insight_${Date.now()}`,
        name: 'Лунное прозрение',
        description: 'Озарение, полученное во время медитации под луной',
        effect: {
          type: 'cultivation_speed',
          value: 1.1,
          duration: 7 * 24 * 60 // 7 дней в минутах
        }
      });
    }
    
    return {
      energyGained: Math.floor(energyGain),
      experienceGained: Math.floor(experienceGain),
      insightGained,
      description: insightGained
        ? `Медитация под ${this.currentPhase.name.toLowerCase()} оказалась невероятно эффективной! Вы получили ${Math.floor(energyGain)} единиц энергии, ${Math.floor(experienceGain)} опыта и достигли глубокого прозрения!`
        : `Медитация под ${this.currentPhase.name.toLowerCase()} была успешной. Вы получили ${Math.floor(energyGain)} единиц энергии и ${Math.floor(experienceGain)} опыта культивации.`
    };
  }
  
  /**
   * Обрабатывает предсказания по луне
   * @param {Object} context - Игровой контекст
   * @returns {Object} Результат предсказания
   */
  processLunarDivination(context) {
    const intellectLevel = context.player.stats?.intellect || 1;
    const astronomySkillLevel = context.player.skills?.astronomy?.level || 1;
    
    // Чем выше интеллект и навык астрономии, тем точнее предсказания
    const accuracyModifier = (intellectLevel + astronomySkillLevel) / 10;
    
    // Количество предсказаний зависит от уровня навыков
    const predictionCount = 1 + Math.floor(astronomySkillLevel / 2);
    
    // Генерируем предсказания
    const predictions = this.generatePredictions(predictionCount, accuracyModifier, context);
    
    // Даем немного опыта за использование навыка
    if (context.player.skills?.astronomy) {
      context.player.skills.astronomy.experience = 
        (context.player.skills.astronomy.experience || 0) + 5;
    }
    
    return {
      predictions,
      description: `Изучая ${this.currentPhase.name.toLowerCase()}, вы сделали ${predictionCount} предсказани${predictionCount === 1 ? 'е' : (predictionCount < 5 ? 'я' : 'й')} о будущих событиях.`
    };
  }
  
  /**
   * Генерирует предсказания о будущих событиях
   * @param {number} count - Количество предсказаний
   * @param {number} accuracy - Модификатор точности (0-1)
   * @param {Object} context - Игровой контекст
   * @returns {Array} Список предсказаний
   */
  generatePredictions(count, accuracy, context) {
    // Список возможных предсказаний
    const possiblePredictions = [
      // Погодные предсказания
      { 
        text: 'В ближайшие дни ожидаются сильные дожди', 
        category: 'weather',
        accuracy: 0.7 * accuracy
      },
      { 
        text: 'Приближается гроза, которая принесет особую духовную энергию', 
        category: 'weather',
        accuracy: 0.6 * accuracy
      },
      { 
        text: 'Скоро наступит период ясной погоды, благоприятный для медитаций', 
        category: 'weather',
        accuracy: 0.8 * accuracy
      },
      
      // Предсказания о ресурсах
      { 
        text: 'В ближайшее время в лесах появятся редкие духовные травы', 
        category: 'resources',
        accuracy: 0.6 * accuracy
      },
      { 
        text: 'Скоро в горах можно будет найти особые минералы', 
        category: 'resources',
        accuracy: 0.5 * accuracy
      },
      
      // Предсказания о событиях
      { 
        text: 'В городе скоро состоится важное собрание культиваторов', 
        category: 'events',
        accuracy: 0.4 * accuracy
      },
      { 
        text: 'На дорогах в ближайшее время участятся нападения разбойников', 
        category: 'events',
        accuracy: 0.5 * accuracy
      },
      { 
        text: 'Скоро произойдет редкое астрономическое явление, усиливающее духовную энергию', 
        category: 'events',
        accuracy: 0.3 * accuracy
      },
      
      // Предсказания о культивации
      { 
        text: 'Приближается благоприятный период для прорыва в культивации', 
        category: 'cultivation',
        accuracy: 0.4 * accuracy
      },
      { 
        text: 'Скоро наступит время, когда медитация будет особенно эффективна', 
        category: 'cultivation',
        accuracy: 0.6 * accuracy
      }
    ];
    
    // Создаем копию массива для случайного выбора
    const predictionsForSelection = [...possiblePredictions];
    const selectedPredictions = [];
    
    // Выбираем случайные предсказания
    for (let i = 0; i < count; i++) {
      if (predictionsForSelection.length === 0) break;
      
      // Выбираем случайное предсказание
      const randomIndex = Math.floor(Math.random() * predictionsForSelection.length);
      const selectedPrediction = predictionsForSelection.splice(randomIndex, 1)[0];
      
      // Определяем, верное ли предсказание
      const isTruePrediction = Math.random() < selectedPrediction.accuracy;
      
      selectedPredictions.push({
        text: selectedPrediction.text,
        category: selectedPrediction.category,
        isTruePrediction // В реальной игре клиент не должен знать это значение
      });
    }
    
    return selectedPredictions;
  }
  
  /**
   * Обрабатывает сбор трав под луной
   * @param {Object} context - Игровой контекст
   * @returns {Object} Результат сбора трав
   */
  processLunarHerbGathering(context) {
    const playerLevel = context.player.cultivation.level;
    const herbGatheringSkillLevel = context.player.skills?.herbGathering?.level || 1;
    
    // Базовое количество трав зависит от навыка сбора трав
    let herbCount = 1 + Math.floor(herbGatheringSkillLevel / 2);
    
    // Шанс редких трав зависит от фазы луны
    // Полнолуние и новолуние - противоположные, но оба особенные
    let rareHerbChance;
    if (this.currentPhase.id === 'full_moon') {
      rareHerbChance = 0.3; // 30% на редкую траву при полнолунии
    } else if (this.currentPhase.id === 'new_moon') {
      rareHerbChance = 0.2; // 20% на редкую траву при новолунии
    } else {
      rareHerbChance = 0.1; // 10% в остальных фазах
    }
    
    // Собираем травы
    const herbs = this.collectLunarHerbs(herbCount, rareHerbChance, context);
    
    // Даем немного опыта за использование навыка
    if (context.player.skills?.herbGathering) {
      context.player.skills.herbGathering.experience = 
        (context.player.skills.herbGathering.experience || 0) + 5;
    }
    
    // Добавляем травы в инвентарь игрока
    if (context.player.inventory && context.player.inventory.items) {
      for (const herb of herbs) {
        // Проверяем, есть ли уже такая трава в инвентаре
        const existingIndex = context.player.inventory.items.findIndex(item => item.id === herb.id);
        
        if (existingIndex !== -1) {
          // Если трава уже есть, увеличиваем количество
          context.player.inventory.items[existingIndex].quantity += herb.quantity;
        } else {
          // Если травы нет, добавляем новую
          context.player.inventory.items.push(herb);
        }
      }
    }
    
    return {
      herbs,
      description: herbs.length > 0
        ? `Под влиянием ${this.currentPhase.name.toLowerCase()} вы собрали ${herbs.reduce((total, herb) => total + herb.quantity, 0)} трав${herbs.some(herb => herb.rarity === 'rare') ? ', включая редкие!' : '.'}`
        : 'К сожалению, вам не удалось найти трав, на которые влияет лунный свет.'
    };
  }
  
  /**
   * Собирает травы, находящиеся под влиянием луны
   * @param {number} count - Базовое количество трав
   * @param {number} rareChance - Шанс редкой травы
   * @param {Object} context - Игровой контекст
   * @returns {Array} Список собранных трав
   */
  collectLunarHerbs(count, rareChance, context) {
    // Список трав, которые можно собрать под луной
    const lunarHerbs = [
      {
        id: 'moonlight_grass',
        name: 'Лунная трава',
        description: 'Обычная трава, собранная в лунном свете. Имеет слабые целебные свойства.',
        type: 'herb',
        rarity: 'common',
        quality: 1,
        quantity: 1,
        lunarPhaseBonus: {
          'full_moon': { quality: 1.5 },
          'new_moon': { quality: 0.8 }
        }
      },
      {
        id: 'silver_leaf',
        name: 'Серебряный лист',
        description: 'Листья, меняющие цвет в зависимости от лунной фазы. Используются в алхимии.',
        type: 'herb',
        rarity: 'uncommon',
        quality: 2,
        quantity: 1,
        lunarPhaseBonus: {
          'full_moon': { quality: 2.0 },
          'waxing_gibbous': { quality: 1.5 },
          'waning_gibbous': { quality: 1.5 }
        }
      },
      {
        id: 'night_lotus',
        name: 'Ночной лотос',
        description: 'Редкий цветок, который распускается только ночью. Особенно ценен в полнолуние.',
        type: 'herb',
        rarity: 'rare',
        quality: 3,
        quantity: 1,
        lunarPhaseBonus: {
          'full_moon': { quality: 2.0, quantity: 2 }
        }
      },
      {
        id: 'shadow_mushroom',
        name: 'Теневой гриб',
        description: 'Гриб, растущий в тени при слабом лунном свете. Особенно силен в новолуние.',
        type: 'herb',
        rarity: 'uncommon',
        quality: 2,
        quantity: 1,
        lunarPhaseBonus: {
          'new_moon': { quality: 2.0, quantity: 2 }
        }
      },
      {
        id: 'lunar_orchid',
        name: 'Лунная орхидея',
        description: 'Редкий цветок, накапливающий лунную энергию. Самый мощный в полнолуние.',
        type: 'herb',
        rarity: 'rare',
        quality: 3,
        quantity: 1,
        lunarPhaseBonus: {
          'full_moon': { quality: 3.0 }
        }
      }
    ];
    
    // Отбираем травы, доступные в текущей фазе луны
    // Для простоты считаем, что все травы доступны всегда, но с разными бонусами
    const availableHerbs = [...lunarHerbs];
    
    // Собираем травы
    const collectedHerbs = [];
    
    for (let i = 0; i < count; i++) {
      if (availableHerbs.length === 0) break;
      
      // Выбираем случайную траву
      const randomIndex = Math.floor(Math.random() * availableHerbs.length);
      const selectedHerb = { ...availableHerbs[randomIndex] };
      
      // Определяем, будет ли это редкая трава
      let isRare = Math.random() < rareChance;
      
      // Если трава должна быть редкой, но выбранная не редкая, пытаемся найти редкую
      if (isRare && selectedHerb.rarity !== 'rare') {
        const rareHerbs = availableHerbs.filter(herb => herb.rarity === 'rare');
        if (rareHerbs.length > 0) {
          const rareIndex = Math.floor(Math.random() * rareHerbs.length);
          selectedHerb = { ...rareHerbs[rareIndex] };
        }
      }
      
      // Применяем бонусы в зависимости от фазы луны
      if (selectedHerb.lunarPhaseBonus && selectedHerb.lunarPhaseBonus[this.currentPhase.id]) {
        const bonus = selectedHerb.lunarPhaseBonus[this.currentPhase.id];
        
        if (bonus.quality) {
          selectedHerb.quality = Math.floor(selectedHerb.quality * bonus.quality);
        }
        
        if (bonus.quantity) {
          selectedHerb.quantity = Math.floor(selectedHerb.quantity * bonus.quantity);
        }
      }
      
      collectedHerbs.push(selectedHerb);
    }
    
    return collectedHerbs;
  }
}
