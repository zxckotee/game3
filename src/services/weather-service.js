/**
 * Сервис погоды и времени суток
 * Отвечает за управление погодой, временем суток и сезонами в игре
 */
class WeatherService {
  // Множитель времени: 1 минута реального времени = x минут игрового времени
  // Внимание: изменение этого множителя влияет на скорость течения игрового времени!
  static TIME_MULTIPLIER = 120;
  
  // Добавляем метод для безопасного обновления множителя
  static updateMultiplier(newValue) {
    console.log(`🔄 WeatherService - обновление множителя с ${WeatherService.TIME_MULTIPLIER} на ${newValue}`);
    if (typeof newValue === 'number' && !isNaN(newValue) && newValue > 0) {
      WeatherService.TIME_MULTIPLIER = newValue;
      return true;
    }
    console.warn('⚠️ Некорректное значение множителя:', newValue);
    return false;
  }
  
  constructor() {
    // Длина сезона в днях (стандартное значение)
    this.SEASON_LENGTH = 30;
    
    // Порядок сезонов для корректной смены
    this.SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];
    
    // Типы погоды с их базовой вероятностью
    this.weatherTypes = {
      clear: { name: 'Ясно', baseChance: 0.4 },
      cloudy: { name: 'Облачно', baseChance: 0.2 },
      rain: { name: 'Дождь', baseChance: 0.2 },
      thunderstorm: { name: 'Гроза', baseChance: 0.1 },
      fog: { name: 'Туман', baseChance: 0.05 },
      snow: { name: 'Снег', baseChance: 0.05 }
    };
    
    // Сезоны и их особенности
    this.seasons = {
      spring: {
        name: 'Весна',
        weatherModifiers: {
          clear: 1.2,
          cloudy: 1.1,
          rain: 1.5,
          thunderstorm: 1.2,
          fog: 0.8,
          snow: 0.3
        },
        resourceModifiers: {
          herbs: 1.5, // Бонус к сбору трав
          cultivation: 1.2 // Бонус к культивации
        },
        specialEvents: ['bloom', 'spirit_tide'] // Возможные особые события
      },
      summer: {
        name: 'Лето',
        weatherModifiers: {
          clear: 1.7,
          cloudy: 1.0,
          rain: 0.8,
          thunderstorm: 1.5,
          fog: 0.5,
          snow: 0
        },
        resourceModifiers: {
          minerals: 1.3, // Бонус к сбору минералов
          cultivation: 1.3 // Бонус к культивации
        },
        specialEvents: ['solstice', 'meteor_shower'] // Возможные особые события
      },
      autumn: {
        name: 'Осень',
        weatherModifiers: {
          clear: 1.0,
          cloudy: 1.3,
          rain: 1.2,
          thunderstorm: 0.8,
          fog: 1.7,
          snow: 0.4
        },
        resourceModifiers: {
          herbs: 1.4, // Бонус к сбору трав
          food: 1.5 // Бонус к сбору пищи
        },
        specialEvents: ['harvest', 'spirit_wind'] // Возможные особые события
      },
      winter: {
        name: 'Зима',
        weatherModifiers: {
          clear: 0.7,
          cloudy: 1.0,
          rain: 0.4,
          thunderstorm: 0.2,
          fog: 1.0,
          snow: 2.0
        },
        resourceModifiers: {
          minerals: 1.2, // Бонус к сбору минералов
          cultivation: 0.8 // Штраф к культивации
        },
        specialEvents: ['ice_tribulation', 'blizzard'] // Возможные особые события
      }
    };
    
  // Особые погодные и сезонные события
    this.specialEvents = {
      // Весенние события
      bloom: {
        name: 'Цветение духовных трав',
        duration: 180, // минут
        effects: [
          { type: 'resource_bonus', target: 'herbs', modifier: 50 }, // +50% к травам (уже кратно 5)
          { type: 'special_resources', resources: ['divine_petal', 'spirit_bud'] } // Особые ресурсы
        ],
        visualEffects: { filter: 'saturate(1.2) brightness(1.1)' } // Визуальные эффекты
      },
      spirit_tide: {
        name: 'Прилив духовной энергии',
        duration: 120, // минут
        effects: [
          { type: 'cultivation_bonus', modifier: 30 }, // +30% к культивации (уже кратно 5)
          { type: 'energy_regen', modifier: 20 } // +20% к восстановлению энергии (уже кратно 5)
        ],
        visualEffects: { filter: 'brightness(1.15) contrast(1.1)' }
      },
      
      // Летние события
      solstice: {
        name: 'Солнцестояние',
        duration: 60, // минут
        effects: [
          { type: 'fire_cultivation', modifier: 50 }, // +50% к огненной культивации
          { type: 'special_encounters', encounters: ['phoenix_sighting', 'sun_elemental'] }
        ],
        visualEffects: { filter: 'brightness(1.3) sepia(0.3)' }
      },
      meteor_shower: {
        name: 'Метеоритный дождь',
        duration: 90, // минут
        effects: [
          { type: 'mineral_bonus', modifier: 40 }, // +40% к минералам
          { type: 'special_resources', resources: ['star_fragment', 'cosmic_dust'] }
        ],
        visualEffects: { filter: 'brightness(0.7) contrast(1.2)' }
      },
      
      // Осенние события
      harvest: {
        name: 'Сбор урожая',
        duration: 240, // минут
        effects: [
          { type: 'market_discount', modifier: 20 }, // Скидка 20% на рынке
          { type: 'double_loot', chance: 0.2 } // 20% шанс двойной добычи
        ],
        visualEffects: { filter: 'sepia(0.2) contrast(1.1)' }
      },
      spirit_wind: {
        name: 'Духовный ветер',
        duration: 120, // минут
        effects: [
          { type: 'movement_speed', modifier: 30 }, // +30% к скорости передвижения
          { type: 'reduced_encounter', modifier: -30 } // -30% к шансу случайных встреч
        ],
        visualEffects: { filter: 'hue-rotate(10deg) blur(0.5px)' }
      },
      
      // Зимние события
      ice_tribulation: {
        name: 'Ледяная трибуляция',
        duration: 120, // минут
        effects: [
          { type: 'water_cultivation', modifier: 50 }, // +50% к водной культивации
          { type: 'resistance_required', element: 'ice', value: 20 } // Необходима сопротивляемость льду
        ],
        visualEffects: { filter: 'brightness(1.2) contrast(1.3) saturate(0.8)' }
      },
      blizzard: {
        name: 'Метель',
        duration: 180, // минут
        effects: [
          { type: 'movement_penalty', modifier: -50 }, // -50% к скорости передвижения
          { type: 'energy_drain', value: 1 } // Постоянный расход энергии
        ],
        visualEffects: { filter: 'brightness(0.8) contrast(0.9) blur(1px)' }
      }
    };
    
    // Эффекты времени суток
    this.daytimeEffects = {
      dawn: { // 5:00-7:00
        name: 'Рассвет',
        effects: [
          { type: 'perception', modifier: 10 }, // +10% к восприятию
          { type: 'energy_regen', modifier: 5 } // +5% к восстановлению энергии
        ],
        visualEffects: { filter: 'brightness(0.9) sepia(0.2)' }
      },
      morning: { // 7:00-11:00
        name: 'Утро',
        effects: [
          { type: 'cultivation_speed', modifier: 10 }, // +10% к скорости культивации
          { type: 'gathering_speed', modifier: 15 } // +15% к скорости сбора ресурсов
        ],
        visualEffects: { filter: 'brightness(1.1) contrast(1.05)' }
      },
      noon: { // 11:00-14:00
        name: 'Полдень',
        effects: [
          { type: 'fire_cultivation', modifier: 20 }, // +20% к огненной культивации
          { type: 'water_cultivation', modifier: -10 } // -10% к водной культивации
        ],
        visualEffects: { filter: 'brightness(1.2) contrast(1.1)' }
      },
      afternoon: { // 14:00-17:00
        name: 'День',
        effects: [
          { type: 'combat_damage', modifier: 5 }, // +5% к урону в бою
          { type: 'gathering_speed', modifier: 10 } // +10% к скорости сбора ресурсов
        ],
        visualEffects: { filter: 'brightness(1.15) contrast(1.05)' }
      },
      evening: { // 17:00-20:00
        name: 'Вечер',
        effects: [
          { type: 'stealth', modifier: 10 }, // +10% к скрытности
          { type: 'perception', modifier: -5 } // -5% к восприятию
        ],
        visualEffects: { filter: 'brightness(0.9) sepia(0.15)' }
      },
      night: { // 20:00-23:00
        name: 'Ночь',
        effects: [
          { type: 'dark_cultivation', modifier: 20 }, // +20% к тёмной культивации
          { type: 'light_cultivation', modifier: -10 }, // -10% к светлой культивации
          { type: 'stealth', modifier: 20 } // +20% к скрытности
        ],
        visualEffects: { filter: 'brightness(0.7) contrast(1.2) saturate(0.8)' }
      },
      deepNight: { // 23:00-5:00
        name: 'Глубокая ночь',
        effects: [
          { type: 'cultivation_insight', chance: 0.05 }, // 5% шанс получить прозрение при культивации
          { type: 'perception', modifier: -15 }, // -15% к восприятию
          { type: 'stealth', modifier: 30 } // +30% к скрытности
        ],
        visualEffects: { filter: 'brightness(0.6) contrast(1.3) saturate(0.7)' }
      }
    };
  }
  
  /**
   * Инициализация погодных условий для локации
   * @param {Object} location - Информация о локации
   * @param {Object} worldTime - Объект с временем из state.world.time (опционально)
   * @returns {Object} - Начальные погодные условия
   */
  initWeather(location, worldTime = null) {
    let hour, minute, currentSeason, dayCount;
    
    // Если переданы значения времени из worldTime, используем их
    if (worldTime && typeof worldTime === 'object') {
      hour = typeof worldTime.hour === 'number' ? worldTime.hour : new Date().getHours();
      minute = typeof worldTime.minute === 'number' ? worldTime.minute : new Date().getMinutes();
      dayCount = typeof worldTime.day === 'number' ? worldTime.day : 1;
      
      // Используем сезон из worldTime или определяем по умолчанию
      if (worldTime.season && this.seasons[worldTime.season]) {
        currentSeason = worldTime.season;
      } else {
        const seasons = Object.keys(this.seasons);
        currentSeason = seasons[Math.floor(new Date().getMonth() / 3) % 4];
      }
      
      console.log('🌤️ Инициализация погоды с использованием worldTime:', { 
        hour, minute, dayCount, currentSeason 
      });
    } else {
      // Определяем базовые параметры времени от текущей даты
      const now = new Date();
      hour = now.getHours();
      minute = now.getMinutes();
      dayCount = 1;
      
      // Определяем сезон (привязка к реальному сезону)
      const seasons = Object.keys(this.seasons);
      currentSeason = seasons[Math.floor(now.getMonth() / 3) % 4];
      
      console.log('🌤️ Инициализация погоды без worldTime, используем текущее время:', { 
        hour, minute, dayCount, currentSeason 
      });
    }
    
    // Определяем начальную погоду с учетом сезона и локации
    const initialWeather = this._calculateWeather(currentSeason, location);
    
    // Генерируем прогноз погоды
    const forecast = this._generateForecast(initialWeather.type, currentSeason, location, 3); // Передаем текущую погоду
    
    // Вычисляем правильный день сезона на основе мирового дня
    let seasonDay, calculatedSeason;
    
    // Если день превышает длину сезона, вычисляем текущий сезон правильно
    if (dayCount > this.SEASON_LENGTH) {
      // Вычисляем номер дня в текущем сезоне
      seasonDay = ((dayCount - 1) % this.SEASON_LENGTH) + 1;
      
      // Вычисляем, какой сезон должен быть сейчас, учитывая циклический характер сезонов
      const seasonIndex = Math.floor((dayCount - 1) / this.SEASON_LENGTH) % this.SEASON_ORDER.length;
      calculatedSeason = this.SEASON_ORDER[seasonIndex];
      
      console.log('📅 Инициализация погоды с корректировкой сезона:', {
        мировой_день: dayCount,
        день_сезона: seasonDay,
        вычисленный_сезон: calculatedSeason,
        исходный_сезон: currentSeason
      });
      
      // Используем вычисленный сезон вместо переданного
      currentSeason = calculatedSeason;
    } else {
      // Если день в пределах длины сезона, просто используем его
      seasonDay = dayCount;
    }
    
    // Определяем, день сейчас или ночь
    const isDayTime = hour >= 6 && hour < 20;
    
    // Определяем текущий период дня
    const daytimePeriod = this._getDaytimePeriod(hour);
    
    // Сбор эффектов погоды и времени суток
    const weatherEffects = this._collectWeatherEffects(initialWeather.type, currentSeason, daytimePeriod);
    
    // Вычисляем абсолютное время следующей смены погоды
    const currentGameMinutes = hour * 60 + minute;
    const weatherChangeAt = currentGameMinutes + initialWeather.duration;
    
    return {
      hour,
      minute,
      dayCount: dayCount,
      isDayTime,
      currentWeather: initialWeather.type,
      weatherIntensity: initialWeather.intensity,
      weatherChangeAt: weatherChangeAt, // Абсолютное время в минутах (с начала дня)
      nextWeatherChange: initialWeather.duration, // Сохраняем для обратной совместимости
      currentSeason,
      seasonDay, // Используем вычисленный день сезона
      seasonLength: this.SEASON_LENGTH, // Используем константу из сервиса
      activeEvent: null, // Нет активного события в начале
      eventRemainingTime: null,
      weatherEffects,
      forecast
    };
  }

  /**
   * Получение текущего периода суток на основе часа
   * @param {Number} hour - Текущий час (0-23)
   * @returns {String} - Период суток
   */
  _getDaytimePeriod(hour) {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 23) return 'night';
    return 'deepNight'; // 23:00-5:00
  }

  /**
   * Округляет значение до ближайшего целого числа
   * @param {Number} value - Значение для округления
   * @returns {Number} - Округленное значение
   */
  _roundToMultipleOf5(value) {
    // Просто округляем до ближайшего целого
    return Math.round(value);
  }

  /**
   * Сбор эффектов погоды и времени суток
   * @param {String} weatherType - Тип погоды
   * @param {String} season - Текущий сезон
   * @param {String} daytimePeriod - Период суток
   * @returns {Array} - Массив эффектов
   */
  _collectWeatherEffects(weatherType, season, daytimePeriod) {
    const effects = [];
    
    // Добавляем эффекты погоды
    const weatherEffects = {
      clear: [
        { type: 'perception', modifier: 10 }, // +10% к восприятию
        { type: 'fire_cultivation', modifier: 15 } // +15% к огненной культивации
      ],
      cloudy: [
        { type: 'perception', modifier: -5 }, // -5% к восприятию
        { type: 'energy_regen', modifier: -5 } // -5% к восстановлению энергии
      ],
      rain: [
        { type: 'water_cultivation', modifier: 20 }, // +20% к водной культивации
        { type: 'fire_cultivation', modifier: -10 }, // -10% к огненной культивации
        { type: 'movement_speed', modifier: -10 }, // -10% к скорости передвижения
        { type: 'resource_bonus', target: 'herbs', modifier: 20 } // +20% к сбору трав
      ],
      thunderstorm: [
        { type: 'lightning_cultivation', modifier: 30 }, // +30% к молниевой культивации
        { type: 'perception', modifier: -15 }, // -15% к восприятию
        { type: 'movement_speed', modifier: -20 }, // -20% к скорости передвижения
        { type: 'resource_bonus', target: 'crystals', modifier: 30 } // +30% к сбору кристаллов
      ],
      fog: [
        { type: 'perception', modifier: -30 }, // -30% к восприятию
        { type: 'stealth', modifier: 20 }, // +20% к скрытности
        { type: 'water_cultivation', modifier: 15 } // +15% к водной культивации
      ],
      snow: [
        { type: 'water_cultivation', modifier: 25 }, // +25% к водной культивации
        { type: 'movement_speed', modifier: -30 }, // -30% к скорости передвижения
        { type: 'fire_cultivation', modifier: -15 }, // -15% к огненной культивации
        { type: 'resource_bonus', target: 'ores', modifier: 15 } // +15% к сбору руд
      ]
    };
    
    // Добавляем базовые эффекты погоды и округляем все модификаторы
    if (weatherEffects[weatherType]) {
      // Создаем копию эффектов с округленными модификаторами
      const roundedEffects = weatherEffects[weatherType].map(effect => ({
        ...effect,
        modifier: this._roundToMultipleOf5(effect.modifier)
      }));
      effects.push(...roundedEffects);
    }
    
    // Добавляем эффекты времени суток и округляем
    if (this.daytimeEffects[daytimePeriod]) {
      const roundedTimeEffects = this.daytimeEffects[daytimePeriod].effects.map(effect => ({
        ...effect,
        modifier: this._roundToMultipleOf5(effect.modifier)
      }));
      effects.push(...roundedTimeEffects);
    }
    
    // Добавляем сезонные модификаторы к эффектам и округляем
    const seasonData = this.seasons[season];
    if (seasonData && seasonData.resourceModifiers) {
      for (const [resource, modifier] of Object.entries(seasonData.resourceModifiers)) {
        // Преобразуем множитель в процентный бонус и округляем
        const percentBonus = (modifier - 1) * 100;
        effects.push({
          type: 'resource_bonus',
          target: resource,
          modifier: this._roundToMultipleOf5(percentBonus)
        });
      }
    }
    
    return effects;
  }

  /**
   * Генерация прогноза погоды с учетом уникальности погоды
   * @param {String} currentWeatherType - Текущий тип погоды (для избежания повторов)
   * @param {String} season - Текущий сезон
   * @param {Object} location - Информация о локации
   * @param {Number} periods - Количество периодов для прогноза
   * @returns {Array} - Массив прогнозируемых погодных условий
   */
  _generateForecast(currentWeatherType, season, location, periods) {
    const forecast = [];
    let totalDuration = 0;
    let previousWeatherType = currentWeatherType; // Начинаем с текущей погоды
    
    // Собираем все типы погоды для учета разнообразия
    const allWeatherTypes = Object.keys(this.weatherTypes);
    
    // Отслеживаем уже использованные типы погоды для разнообразия
    const usedTypesInForecast = new Set([currentWeatherType]);
    
    for (let i = 0; i < periods; i++) {
      // Генерируем новую погоду со строгим учетом уникальности
      let newWeather = this._calculateWeather(season, location);
      
      // УЛУЧШЕНО: Более строгий алгоритм предотвращения повторения погоды
      let attempts = 0;
      const maxAttempts = 10; // Увеличиваем количество попыток
      
      // Пытаемся избежать повторения уже использованных типов погоды
      while ((newWeather.type === previousWeatherType || usedTypesInForecast.has(newWeather.type)) && 
             attempts < maxAttempts && 
             usedTypesInForecast.size < allWeatherTypes.length) {
        
        // УЛУЧШЕНО: Принудительно выбираем из неиспользованных типов, если много попыток
        if (attempts > 5) {
          const unusedTypes = allWeatherTypes.filter(type => !usedTypesInForecast.has(type));
          if (unusedTypes.length > 0) {
            // Выбираем случайный тип из неиспользованных
            const randomUnusedType = unusedTypes[Math.floor(Math.random() * unusedTypes.length)];
            
            // Создаем новую погоду с этим типом
            const baseWeather = this._calculateWeather(season, location);
            newWeather = {
              type: randomUnusedType,
              intensity: baseWeather.intensity,
              duration: baseWeather.duration
            };
            
            console.log(`🌦️ Принудительное разнообразие прогноза: выбран новый тип ${randomUnusedType}`);
            break;
          }
        } else {
          // Стандартная логика генерации новой погоды
          newWeather = this._calculateWeather(season, location);
        }
        
        attempts++;
      }
      
      // Добавляем тип в уже использованные
      usedTypesInForecast.add(newWeather.type);
      
      // УЛУЧШЕНО: Варьируем продолжительность для разнообразия прогноза
      // Делаем небольшую случайную корректировку в пределах ±20%
      const durationVariation = 0.8 + (Math.random() * 0.4); // от 0.8 до 1.2
      const adjustedDuration = Math.round(newWeather.duration * durationVariation);
      
      // Гарантируем минимальную длительность и округляем до 10 минут
      const finalDuration = Math.max(30, Math.ceil(adjustedDuration / 10) * 10);
      
      // УЛУЧШЕНО: Гарантируем, что вторая и третья погода в прогнозе имеют разные timeToOccur
      const baseTimeToOccur = totalDuration;
      
      // Добавляем случайность к времени наступления для второй и последующих прогнозов
      let timeVariation = 0;
      if (i > 0) {
        // Добавляем случайное смещение до 20 минут (кратно 5 минутам)
        timeVariation = Math.round(Math.random() * 4) * 5;
      }
      
      // Округляем время до наступления до кратных 10 минут
      const roundedTimeToOccur = Math.ceil((baseTimeToOccur + timeVariation) / 10) * 10;
      
      // Добавляем погоду в прогноз с возможной вариацией интенсивности
      const intensityVariation = 0.9 + (Math.random() * 0.2); // от 0.9 до 1.1
      
      forecast.push({
        type: newWeather.type,
        intensity: Math.min(1.5, Math.max(0.5, newWeather.intensity * intensityVariation)),
        timeToOccur: roundedTimeToOccur,
        duration: finalDuration
      });
      
      // Запоминаем тип погоды для следующей итерации
      previousWeatherType = newWeather.type;
      
      // Увеличиваем общую длительность
      totalDuration += finalDuration;
    }
    
    console.log('🌤️ Сгенерирован улучшенный прогноз погоды:', forecast.map(item => 
      `${item.type} через ${item.timeToOccur} мин. (продолжительность ${item.duration} мин.)`
    ));
    
    return forecast;
  }
  
  /**
   * Расчет следующего погодного состояния
   * @param {String} season - Текущий сезон
   * @param {Object} location - Информация о локации
   * @returns {Object} - Новое погодное состояние
   */
  /**
   * Принудительно изменяет погоду на новую
   * @param {Object} currentWeather - Текущее состояние погоды
   * @param {Object} location - Информация о локации
   * @returns {Object} - Обновленное состояние погоды
   */
  forceWeatherChange(currentWeather, location, eventName = null) {
    if (!currentWeather) {
      console.error('❌ forceWeatherChange: не передан currentWeather');
      return {};
    }
    
    console.log('🌤️ Вызван forceWeatherChange, принудительно меняем погоду', { 
      currentSeason: currentWeather.currentSeason,
      dayCount: currentWeather.dayCount,
      seasonDay: currentWeather.seasonDay,
      событие: eventName || 'нет'
    });
    
    // Получаем текущий сезон из переданного состояния
    const season = currentWeather.currentSeason || 'spring';
    
    // Если передано имя события, активируем его 
    if (eventName && this.specialEvents[eventName]) {
      const event = this.specialEvents[eventName];
      console.log(`Активация особого события: ${event.name}`);
      
      // Получаем новую погоду
      let newWeather = this._calculateWeather(season, location);
      
      // Если нет особых требований к погоде, пытаемся избежать повторения текущей погоды
      let attempts = 0;
      while (newWeather.type === currentWeather.currentWeather && attempts < 5) {
        newWeather = this._calculateWeather(season, location);
        attempts++;
      }
      
      // Подготовка эффектов события - обеспечиваем округление модификаторов
      const processedEffects = event.effects.map(effect => {
        if (effect.modifier !== undefined) {
          // Округляем модификатор до значения, кратного 5
          return {
            ...effect,
            modifier: this._roundToMultipleOf5(effect.modifier)
          };
        }
        return effect;
      });
      
      // Формируем обновленное состояние с активным событием
      return {
        ...currentWeather,
        currentWeather: newWeather.type,
        weatherIntensity: newWeather.intensity,
        activeEvent: eventName,
        eventRemainingTime: event.duration,
        weatherEffects: processedEffects,
      };
    }
    
    // Стандартная логика изменения погоды без события
    let newWeather = this._calculateWeather(season, location);
    
    // Пытаемся избежать повторения текущей погоды
    let attempts = 0;
    while (newWeather.type === currentWeather.currentWeather && attempts < 5) {
      newWeather = this._calculateWeather(season, location);
      attempts++;
    }
    
    // Текущий час и минута из переданного состояния
    const hour = typeof currentWeather.hour === 'number' ? currentWeather.hour : 12;
    const minute = typeof currentWeather.minute === 'number' ? currentWeather.minute : 0;
    
    // Расчет абсолютного времени в минутах с начала дня
    const currentGameMinutes = hour * 60 + minute;
    
    // Абсолютное время следующей смены погоды
    const weatherChangeAt = currentGameMinutes + newWeather.duration;
    
    // Генерируем новый прогноз погоды
    const forecast = this._generateForecast(newWeather.type, season, location, 3);
    
    // Определяем период суток
    const daytimePeriod = this._getDaytimePeriod(hour);
    
    // Собираем эффекты погоды и времени суток
    const weatherEffects = this._collectWeatherEffects(newWeather.type, season, daytimePeriod);
    
    console.log('✅ forceWeatherChange: успешно сгенерирована новая погода', {
      тип: newWeather.type,
      интенсивность: newWeather.intensity,
      продолжительность: newWeather.duration,
      время_следующей_смены: weatherChangeAt
    });
    
    // Возвращаем обновленное состояние погоды
    return {
      ...currentWeather,
      currentWeather: newWeather.type,
      weatherIntensity: newWeather.intensity,
      weatherChangeAt: weatherChangeAt,
      nextWeatherChange: newWeather.duration,
      weatherEffects,
      forecast
    };
  }
  
  _calculateWeather(season, location) {
    // Копируем базовые вероятности
    const probabilities = {};
    
    // Заполняем вероятностями по умолчанию
    for (const [type, info] of Object.entries(this.weatherTypes)) {
      probabilities[type] = info.baseChance;
    }
    
    // Применяем сезонные модификаторы
    const seasonData = this.seasons[season];
    if (seasonData) {
      for (const [type, modifier] of Object.entries(seasonData.weatherModifiers)) {
        probabilities[type] *= modifier;
      }
    }
    
    // Применяем локационные модификаторы, если они есть
    if (location?.weatherModifiers) {
      for (const [type, modifier] of Object.entries(location.weatherModifiers)) {
        probabilities[type] *= modifier;
      }
    }
    
    // Нормализуем вероятности, чтобы сумма была равна 1
    const totalProbability = Object.values(probabilities).reduce((sum, p) => sum + p, 0);
    for (const type in probabilities) {
      probabilities[type] /= totalProbability;
    }
    
    // Выбираем погоду на основе вероятностей
    const random = Math.random();
    let cumulative = 0;
    
    for (const [type, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      
      if (random <= cumulative) {
        // Определяем интенсивность (от 0.5 до 1.5)
        const intensity = 0.5 + Math.random();
        
        // Определяем длительность (от 300 до 600 минут игрового времени)
        const baseDuration = 300 + Math.floor(Math.random() * 300);
        
        // Модифицируем длительность в зависимости от типа погоды
        const durationModifiers = {
          clear: 1.5, // Ясная погода длится дольше
          cloudy: 1.2,
          rain: 0.8,
          thunderstorm: 0.7, // Грозы обычно короче
          fog: 1.0,
          snow: 1.1
        };
        
        // Округляем длительность до ближайших 10 минут
        let duration = Math.floor(baseDuration * (durationModifiers[type] || 1.0));
        
        // ВАЖНО: Гарантируем минимум 300 минут игрового времени
        duration = Math.max(300, Math.ceil(duration / 10) * 10);
        
        return {
          type,
          intensity,
          duration
        };
      }
    }
    
    // По умолчанию возвращаем ясную погоду
    return {
      type: 'clear',
      intensity: 1.0,
      duration: 120
    };
  }
  
  /**
   * Обновляет время и погоду в зависимости от прошедших минут реального времени
   * @param {Object} currentWeather - Текущее состояние погоды
   * @param {Object} location - Информация о локации
   * @param {Object} worldTime - Объект с актуальным временем из state.world.time
   * @param {Number} realMinutesPassed - Количество прошедших минут реального времени
   * @returns {Object} - Обновленное состояние погоды
   */
  updateTime(currentWeather, location, worldTime, realMinutesPassed = 1) {
    if (!currentWeather) {
      console.error('❌ updateTime: не передан currentWeather');
      return {};
    }
    
    console.log('🕒 Вызван updateTime:', { 
      worldTime,
      realMinutesPassed,
      множитель: WeatherService.TIME_MULTIPLIER
    });
    
    // Проверяем, есть ли новые данные времени в worldTime (как единственный источник истины)
    let hour, minute, dayCount, currentSeason;
    
    if (worldTime && typeof worldTime === 'object') {
      hour = typeof worldTime.hour === 'number' ? worldTime.hour : currentWeather.hour || 0;
      minute = typeof worldTime.minute === 'number' ? worldTime.minute : currentWeather.minute || 0;
      dayCount = typeof worldTime.day === 'number' ? worldTime.day : currentWeather.dayCount || 1;
      currentSeason = worldTime.season || currentWeather.currentSeason || 'spring';
      
      console.log('🕒 Использую worldTime как источник истины:', {
        hour, minute, dayCount, currentSeason
      });
    } else {
      // Используем текущее состояние, если worldTime не предоставлен
      hour = currentWeather.hour || 0;
      minute = currentWeather.minute || 0;
      dayCount = currentWeather.dayCount || 1;
      currentSeason = currentWeather.currentSeason || 'spring';
    }
    
    // Рассчитываем абсолютное время в минутах
    const absoluteMinutes = hour * 60 + minute;
    
    // Проверяем, нужно ли обновить погоду на основе абсолютного времени
    // weatherChangeAt содержит абсолютное время в минутах (с начала дня), когда должна смениться погода
    const weatherChangeAt = currentWeather.weatherChangeAt || (absoluteMinutes + 60); // По умолчанию через час
    
    console.log('⏱️ Проверка необходимости обновления погоды:', {
      текущее_абсолютное_время: absoluteMinutes,
      смена_погоды_в: weatherChangeAt,
      разница: weatherChangeAt - absoluteMinutes,
      текущая_погода: currentWeather.currentWeather
    });
    
    // Копируем текущее состояние, чтобы не изменять его напрямую
    let updatedState = { ...currentWeather };
    
    // Синхронизируем значения из worldTime (источник истины)
    updatedState.hour = hour;
    updatedState.minute = minute;
    updatedState.dayCount = dayCount;
    
    // Обработка смены сезона при превышении дня сезона 
    const previousSeasonDay = currentWeather.seasonDay || 1;
    
    // Обнаруживаем, что текущий день сезона превышает максимальную длину сезона
    if (dayCount > this.SEASON_LENGTH) {
      // Вычисляем номер дня в новом сезоне
      const newSeasonDay = ((dayCount - 1) % this.SEASON_LENGTH) + 1;
      
      // Вычисляем, какой сезон должен быть сейчас, учитывая циклический характер сезонов
      const seasonIndex = Math.floor((dayCount - 1) / this.SEASON_LENGTH) % this.SEASON_ORDER.length;
      const calculatedSeason = this.SEASON_ORDER[seasonIndex];
      
      console.log('🌈 СМЕНА СЕЗОНА:', {
        прошлый_день_сезона: previousSeasonDay,
        новый_день_сезона: newSeasonDay,
        текущий_мировой_день: dayCount,
        прошлый_сезон: currentSeason,
        новый_сезон: calculatedSeason,
        длина_сезона: this.SEASON_LENGTH
      });
      
      // Обновляем сезон и день сезона
      updatedState.currentSeason = calculatedSeason;
      updatedState.seasonDay = newSeasonDay;
      
      // Генерируем новую погоду для нового сезона
      let newSeasonWeather = this._calculateWeather(calculatedSeason, location);
      
      // Обновляем погоду для нового сезона
      updatedState.currentWeather = newSeasonWeather.type;
      updatedState.weatherIntensity = newSeasonWeather.intensity;
      
      // Определяем новое абсолютное время следующей смены погоды
      updatedState.weatherChangeAt = absoluteMinutes + newSeasonWeather.duration;
      updatedState.nextWeatherChange = newSeasonWeather.duration;
      
      // Обновляем прогноз для нового сезона
      updatedState.forecast = this._generateForecast(newSeasonWeather.type, calculatedSeason, location, 3);
      
      // Обновляем эффекты погоды для нового сезона
      const daytimePeriod = this._getDaytimePeriod(hour);
      updatedState.weatherEffects = this._collectWeatherEffects(newSeasonWeather.type, calculatedSeason, daytimePeriod);
    } else {
      // Если день в пределах длины сезона, просто обновляем день сезона
      updatedState.seasonDay = dayCount;
      updatedState.currentSeason = currentSeason;
    }
    
    // ИСПРАВЛЕНИЕ: Сначала проверяем, равно ли nextWeatherChange нулю от предыдущих обновлений
    if (currentWeather.nextWeatherChange === 0 || absoluteMinutes >= weatherChangeAt) {
      console.log('🌦️ Время смены погоды наступило!', {
        текущее_время: absoluteMinutes,
        время_смены: weatherChangeAt,
        старая_погода: updatedState.currentWeather,
        счетчик_next_weather_change: currentWeather.nextWeatherChange,
        причина: currentWeather.nextWeatherChange === 0 ? "nextWeatherChange = 0" : "absoluteMinutes >= weatherChangeAt"
      });
      
      // Генерируем новую погоду, отличную от текущей
      let newWeather = this._calculateWeather(currentSeason, location);
      
      // Пытаемся избежать повторения текущей погоды
      let attempts = 0;
      while (newWeather.type === updatedState.currentWeather && attempts < 5) {
        newWeather = this._calculateWeather(currentSeason, location);
        attempts++;
      }
      
      // Обновляем погоду
      updatedState.currentWeather = newWeather.type;
      updatedState.weatherIntensity = newWeather.intensity;
      
      // Определяем новое абсолютное время следующей смены погоды
      updatedState.weatherChangeAt = absoluteMinutes + newWeather.duration;
      
      // Для обратной совместимости сохраняем длительность
      updatedState.nextWeatherChange = newWeather.duration;
      
      // Обновляем прогноз
      updatedState.forecast = this._generateForecast(newWeather.type, currentSeason, location, 3);
      
      // Обновляем эффекты погоды
      const daytimePeriod = this._getDaytimePeriod(hour);
      updatedState.weatherEffects = this._collectWeatherEffects(newWeather.type, currentSeason, daytimePeriod);
      
      console.log('🌤️ Погода изменена:', {
        новая_погода: updatedState.currentWeather,
        интенсивность: updatedState.weatherIntensity,
        следующая_смена_через: newWeather.duration,
        абсолютное_время_смены: updatedState.weatherChangeAt
      });
    } else {
      // Просто уменьшаем время до следующей смены погоды
      const remainingMinutes = weatherChangeAt - absoluteMinutes;
      
      // ВАЖНОЕ ИСПРАВЛЕНИЕ: Гарантируем, что nextWeatherChange всегда положительное число
      // или как минимум 0, чтобы избежать застревания отрицательных значений
      updatedState.nextWeatherChange = Math.max(0, remainingMinutes);
      
      console.log('⏳ До смены погоды осталось:', updatedState.nextWeatherChange, 'мин.', {
        weatherChangeAt,
        absoluteMinutes,
        разница: weatherChangeAt - absoluteMinutes
      });
      
      // ИСПРАВЛЕНИЕ: Если оставшееся время равно 0, НЕМЕДЛЕННО меняем погоду, не ждем следующего цикла
      if (updatedState.nextWeatherChange === 0) {
        console.log('⚠️ Обнаружен счетчик с 0 минут! Выполняем НЕМЕДЛЕННУЮ смену погоды!');
        
        // Генерируем новую погоду, отличную от текущей
        let newWeather = this._calculateWeather(currentSeason, location);
        
        // Пытаемся избежать повторения текущей погоды
        let attempts = 0;
        while (newWeather.type === updatedState.currentWeather && attempts < 5) {
          newWeather = this._calculateWeather(currentSeason, location);
          attempts++;
        }
        
        // Обновляем погоду
        updatedState.currentWeather = newWeather.type;
        updatedState.weatherIntensity = newWeather.intensity;
        
        // Определяем новое абсолютное время следующей смены погоды
        updatedState.weatherChangeAt = absoluteMinutes + newWeather.duration;
        
        // Для обратной совместимости сохраняем длительность
        updatedState.nextWeatherChange = newWeather.duration;
        
        // Обновляем прогноз
        updatedState.forecast = this._generateForecast(newWeather.type, currentSeason, location, 3);
        
        // Обновляем эффекты погоды
        const daytimePeriod = this._getDaytimePeriod(hour);
        updatedState.weatherEffects = this._collectWeatherEffects(newWeather.type, currentSeason, daytimePeriod);
        
        console.log('🌤️ Погода НЕМЕДЛЕННО изменена из-за нулевого счетчика:', {
          новая_погода: updatedState.currentWeather,
          интенсивность: updatedState.weatherIntensity,
          следующая_смена_через: newWeather.duration,
          абсолютное_время_смены: updatedState.weatherChangeAt
        });
      }
    }
    
    // Обновляем isDayTime на основе текущего часа
    updatedState.isDayTime = hour >= 6 && hour < 20;
    
    return updatedState;
  }
}

// Экспортируем сервис погоды
module.exports = WeatherService;


// Экспортируем отдельные методы для совместимости
module.exports.updateMultiplier = WeatherService.updateMultiplier;