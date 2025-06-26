/**
 * Клиентская версия WeatherService без серверных зависимостей
 * Используется в браузере вместо оригинального weather-service.js
 */

class WeatherServiceAPI {
  // Множитель времени (такой же, как в оригинальном сервисе)
  static TIME_MULTIPLIER = 120;
  
  /**
   * Получает текущую погоду для инициализации
   * @returns {Object} Объект с информацией о погоде
   */
  static getCurrentWeather() {
    // Инициализируем базовую погоду на основе текущего времени
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Определяем сезон на основе текущего месяца
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const currentSeason = seasons[Math.floor(now.getMonth() / 3)];
    
    // Определяем, день сейчас или ночь
    const isDayTime = hour >= 6 && hour < 20;
    
    // Определяем тип погоды случайным образом
    const weatherTypes = ['clear', 'cloudy', 'rain', 'thunderstorm', 'fog', 'snow'];
    const weatherProbabilities = [0.4, 0.2, 0.2, 0.1, 0.05, 0.05];
    
    // Выбираем случайный тип погоды на основе вероятностей
    let currentWeather = 'clear'; // По умолчанию ясно
    const randomValue = Math.random();
    let probabilitySum = 0;
    
    for (let i = 0; i < weatherTypes.length; i++) {
      probabilitySum += weatherProbabilities[i];
      if (randomValue <= probabilitySum) {
        currentWeather = weatherTypes[i];
        break;
      }
    }
    
    // Для зимы увеличиваем шанс снега
    if (currentSeason === 'winter' && Math.random() < 0.5) {
      currentWeather = 'snow';
    }
    
    // Генерируем базовые эффекты погоды
    const weatherEffects = this._collectWeatherEffects(currentWeather, currentSeason, this._getDaytimePeriod(hour));
    
    return {
      hour,
      minute,
      dayCount: 1,
      isDayTime,
      currentWeather,
      weatherIntensity: Math.random() * 0.5 + 0.5, // От 0.5 до 1.0
      weatherChangeAt: (hour * 60 + minute) + Math.floor(Math.random() * 180 + 60), // Через 1-4 часа
      nextWeatherChange: Math.floor(Math.random() * 180 + 60), // Для обратной совместимости
      currentSeason,
      seasonDay: 1,
      seasonLength: 30,
      activeEvent: null,
      eventRemainingTime: null,
      weatherEffects,
      forecast: this._generateForecast(currentWeather, currentSeason, {}, 3)
    };
  }
  
  /**
   * Инициализирует погоду для локации
   * API-версия метода initWeather
   * @param {Object} location - Информация о локации
   * @param {Object} worldTime - Игровое время
   * @returns {Object} Начальные погодные условия
   */
  static initWeather(location, worldTime = null) {
    // В клиентской версии просто возвращаем текущую погоду
    return this.getCurrentWeather();
  }
  
  /**
   * Обновляет игровое время и погоду
   * API-версия метода updateTime
   * @param {Object} currentWeather - Текущие погодные условия
   * @param {Object} location - Информация о локации
   * @param {Object} worldTime - Игровое время
   * @param {number} realMinutesPassed - Прошедшие реальные минуты
   * @returns {Object} Обновленные погодные условия
   */
  static updateTime(currentWeather, location, worldTime, realMinutesPassed = 1) {
    if (!currentWeather) {
      return this.getCurrentWeather();
    }
    
    // Клонируем текущую погоду для изменения
    const updatedState = { ...currentWeather };
    
    // Рассчитываем, сколько игровых минут прошло
    const gameMinutesPassed = realMinutesPassed * this.TIME_MULTIPLIER;
    
    // Обновляем время
    let newMinute = updatedState.minute + gameMinutesPassed;
    let newHour = updatedState.hour;
    let newDay = updatedState.dayCount;
    
    // Обрабатываем переполнение минут
    if (newMinute >= 60) {
      newHour += Math.floor(newMinute / 60);
      newMinute %= 60;
    }
    
    // Обрабатываем переполнение часов
    if (newHour >= 24) {
      newDay += Math.floor(newHour / 24);
      newHour %= 24;
    }
    
    // Обновляем время в объекте погоды
    updatedState.minute = newMinute;
    updatedState.hour = newHour;
    updatedState.dayCount = newDay;
    updatedState.isDayTime = newHour >= 6 && newHour < 20;
    
    // Проверяем, нужно ли менять погоду
    const currentGameMinutes = newHour * 60 + newMinute;
    
    if (currentGameMinutes >= updatedState.weatherChangeAt) {
      // Генерируем новую погоду
      const weatherTypes = ['clear', 'cloudy', 'rain', 'thunderstorm', 'fog', 'snow'];
      const newWeatherIndex = Math.floor(Math.random() * weatherTypes.length);
      const newWeather = weatherTypes[newWeatherIndex];
      
      // Обновляем тип погоды
      updatedState.currentWeather = newWeather;
      updatedState.weatherIntensity = Math.random() * 0.5 + 0.5;
      
      // Устанавливаем время следующей смены погоды (через 1-4 часа)
      const nextChangeTime = Math.floor(Math.random() * 180 + 60);
      updatedState.weatherChangeAt = currentGameMinutes + nextChangeTime;
      updatedState.nextWeatherChange = nextChangeTime;
      
      // Обновляем эффекты погоды
      updatedState.weatherEffects = this._collectWeatherEffects(
        newWeather, 
        updatedState.currentSeason,
        this._getDaytimePeriod(newHour)
      );
    }
    
    return updatedState;
  }
  
  /**
   * Принудительно меняет погоду на новую
   * Клиентская реализация метода forceWeatherChange
   * @param {Object} currentWeather - Текущие погодные условия
   * @param {Object} location - Информация о локации
   * @param {string} eventName - Название события (опционально)
   * @returns {Object} Обновленные погодные условия
   */
  static forceWeatherChange(currentWeather, location, eventName = null) {
    if (!currentWeather) {
      return this.getCurrentWeather();
    }
    
    // Клонируем текущее состояние
    const updatedWeather = { ...currentWeather };
    
    // Текущее время в минутах
    const currentHour = updatedWeather.hour || 0;
    const currentMinute = updatedWeather.minute || 0;
    const currentGameMinutes = currentHour * 60 + currentMinute;
    
    // Генерируем новую погоду случайным образом
    const weatherTypes = ['clear', 'cloudy', 'rain', 'thunderstorm', 'fog', 'snow'];
    
    // Исключаем текущую погоду из возможных вариантов
    const availableTypes = weatherTypes.filter(type => type !== updatedWeather.currentWeather);
    
    // Выбираем случайный тип погоды
    const newWeatherIndex = Math.floor(Math.random() * availableTypes.length);
    const newWeather = availableTypes[newWeatherIndex];
    
    // Обновляем тип погоды
    updatedWeather.currentWeather = newWeather;
    updatedWeather.weatherIntensity = Math.random() * 0.5 + 0.5;
    
    // Устанавливаем время следующей смены погоды (через 1-4 часа)
    const nextChangeTime = Math.floor(Math.random() * 180 + 60);
    updatedWeather.weatherChangeAt = currentGameMinutes + nextChangeTime;
    updatedWeather.nextWeatherChange = nextChangeTime;
    
    // Обновляем эффекты погоды
    updatedWeather.weatherEffects = this._collectWeatherEffects(
      newWeather, 
      updatedWeather.currentSeason,
      this._getDaytimePeriod(currentHour)
    );
    
    // Генерируем новый прогноз
    updatedWeather.forecast = this._generateForecast(
      newWeather, 
      updatedWeather.currentSeason, 
      location || {}, 
      3
    );
    
    return updatedWeather;
  }
  
  /**
   * Получает период суток на основе часа
   * @param {number} hour - Час (0-23)
   * @returns {string} - Период суток
   */
  static _getDaytimePeriod(hour) {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 23) return 'night';
    return 'deepNight'; // 23:00-5:00
  }
  
  /**
   * Собирает эффекты погоды и времени суток
   * @param {string} weatherType - Тип погоды
   * @param {string} season - Сезон
   * @param {string} daytimePeriod - Период суток
   * @returns {Array} - Массив эффектов
   */
  static _collectWeatherEffects(weatherType, season, daytimePeriod) {
    const effects = [];
    
    // Базовые эффекты погоды
    const weatherEffects = {
      clear: [
        { type: 'perception', modifier: 10 },
        { type: 'fire_cultivation', modifier: 15 }
      ],
      cloudy: [
        { type: 'perception', modifier: -5 },
        { type: 'energy_regen', modifier: -5 }
      ],
      rain: [
        { type: 'water_cultivation', modifier: 20 },
        { type: 'fire_cultivation', modifier: -10 },
        { type: 'movement_speed', modifier: -10 },
        { type: 'resource_bonus', target: 'herbs', modifier: 20 }
      ],
      thunderstorm: [
        { type: 'lightning_cultivation', modifier: 30 },
        { type: 'perception', modifier: -15 },
        { type: 'movement_speed', modifier: -20 },
        { type: 'resource_bonus', target: 'crystals', modifier: 30 }
      ],
      fog: [
        { type: 'perception', modifier: -30 },
        { type: 'stealth', modifier: 20 },
        { type: 'water_cultivation', modifier: 15 }
      ],
      snow: [
        { type: 'water_cultivation', modifier: 25 },
        { type: 'movement_speed', modifier: -30 },
        { type: 'fire_cultivation', modifier: -15 },
        { type: 'resource_bonus', target: 'ores', modifier: 15 }
      ]
    };
    
    // Добавляем эффекты текущей погоды
    if (weatherEffects[weatherType]) {
      effects.push(...weatherEffects[weatherType]);
    }
    
    // Эффекты времени суток
    const daytimeEffects = {
      dawn: [
        { type: 'perception', modifier: 10 },
        { type: 'energy_regen', modifier: 5 }
      ],
      morning: [
        { type: 'cultivation_speed', modifier: 10 },
        { type: 'gathering_speed', modifier: 15 }
      ],
      noon: [
        { type: 'fire_cultivation', modifier: 20 },
        { type: 'water_cultivation', modifier: -10 }
      ],
      afternoon: [
        { type: 'combat_damage', modifier: 5 },
        { type: 'gathering_speed', modifier: 10 }
      ],
      evening: [
        { type: 'stealth', modifier: 10 },
        { type: 'perception', modifier: -5 }
      ],
      night: [
        { type: 'dark_cultivation', modifier: 20 },
        { type: 'light_cultivation', modifier: -10 },
        { type: 'stealth', modifier: 20 }
      ],
      deepNight: [
        { type: 'cultivation_insight', chance: 0.05 },
        { type: 'perception', modifier: -15 },
        { type: 'stealth', modifier: 30 }
      ]
    };
    
    // Добавляем эффекты времени суток
    if (daytimeEffects[daytimePeriod]) {
      effects.push(...daytimeEffects[daytimePeriod]);
    }
    
    // Сезонные эффекты
    const seasonEffects = {
      spring: [
        { type: 'resource_bonus', target: 'herbs', modifier: 50 },
        { type: 'cultivation', modifier: 20 }
      ],
      summer: [
        { type: 'resource_bonus', target: 'minerals', modifier: 30 },
        { type: 'cultivation', modifier: 30 }
      ],
      autumn: [
        { type: 'resource_bonus', target: 'herbs', modifier: 40 },
        { type: 'resource_bonus', target: 'food', modifier: 50 }
      ],
      winter: [
        { type: 'resource_bonus', target: 'minerals', modifier: 20 },
        { type: 'cultivation', modifier: -20 }
      ]
    };
    
    // Добавляем сезонные эффекты
    if (seasonEffects[season]) {
      effects.push(...seasonEffects[season]);
    }
    
    return effects;
  }
  
  /**
   * Генерирует прогноз погоды
   * @param {string} currentWeatherType - Текущий тип погоды
   * @param {string} season - Текущий сезон
   * @param {Object} location - Информация о локации
   * @param {number} periods - Количество периодов для прогноза
   * @returns {Array} - Массив прогнозируемых погодных условий
   */
  static _generateForecast(currentWeatherType, season, location, periods) {
    const forecast = [];
    let previousWeatherType = currentWeatherType;
    
    // Собираем все типы погоды
    const weatherTypes = ['clear', 'cloudy', 'rain', 'thunderstorm', 'fog', 'snow'];
    
    // Генерируем прогноз погоды на несколько периодов
    for (let i = 0; i < periods; i++) {
      // Выбираем случайный тип погоды, отличный от предыдущего
      let newWeatherType;
      do {
        newWeatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      } while (newWeatherType === previousWeatherType);
      
      // Длительность погоды (от 1 до 4 часов)
      const duration = Math.floor(Math.random() * 180 + 60);
      
      // Интенсивность (от 0.5 до 1.0)
      const intensity = Math.random() * 0.5 + 0.5;
      
      // Добавляем в прогноз
      forecast.push({
        type: newWeatherType,
        duration,
        intensity
      });
      
      previousWeatherType = newWeatherType;
    }
    
    return forecast;
  }
}

// Экспортируем класс через CommonJS
module.exports = WeatherServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getCurrentWeather = WeatherServiceAPI.getCurrentWeather;
module.exports.initWeather = WeatherServiceAPI.initWeather;
module.exports.updateTime = WeatherServiceAPI.updateTime;
module.exports.forceWeatherChange = WeatherServiceAPI.forceWeatherChange;
module.exports.TIME_MULTIPLIER = WeatherServiceAPI.TIME_MULTIPLIER;

// Экспортируем приватные методы для тестирования
module.exports._getDaytimePeriod = WeatherServiceAPI._getDaytimePeriod;
module.exports._collectWeatherEffects = WeatherServiceAPI._collectWeatherEffects;
module.exports._generateForecast = WeatherServiceAPI._generateForecast;