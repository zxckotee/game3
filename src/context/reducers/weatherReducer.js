import ACTION_TYPES from '../actions/actionTypes';

const {
  WEATHER_INIT,
  WEATHER_UPDATE,
  WEATHER_CHANGE,
  SEASON_CHANGE,
  TIME_PERIOD_CHANGE,
  APPLY_WEATHER_EFFECTS,
  WEATHER_EFFECTS_UPDATE
} = ACTION_TYPES;
import WeatherService from '../../services/weather-service-adapter';

// Создаем экземпляр сервиса погоды
const weatherService = new WeatherService();

// Начальное состояние
const initialState = {
  time: {
    hour: 12,
    minute: 0,
    dayPeriod: 'day',
    day: 1,
    season: 'spring',
    seasonDay: 1,
    formattedTime: '12:00',
    formattedPeriod: 'День'
  },
  weather: {
    type: 'clear',
    intensity: 50,
    icon: '☀️',
    label: 'Ясно'
  },
  season: {
    name: 'spring',
    day: 1,
    icon: '🌱',
    label: 'Весна'
  },
  effects: {
    cultivation: { value: 0, description: '' },
    techniques: {},
    resources: { value: 0, description: '' },
    perception: { value: 0, description: '' },
    movement: { value: 0, description: '' },
    inspiration: { value: 0, description: '' },
    elements: {}
  },
  weatherEffects: [], // Массив эффектов погоды из API
  visualEffects: {
    filter: '',
    animation: '',
    background: '',
    overlay: ''
  }
};

/**
 * Редьюсер для системы погоды и времени
 * @param {Object} state - Текущее состояние
 * @param {Object} action - Действие для обработки
 * @return {Object} Новое состояние
 */
const weatherReducer = (state = initialState, action) => {
  switch (action.type) {
    case WEATHER_INIT: {
      const { location } = action.payload;
      const weatherState = weatherService.initWeather(location);
      
      return {
        ...weatherState,
        visualEffects: weatherService.getVisualEffects(weatherState)
      };
    }
    
    case WEATHER_UPDATE: {
      const { currentState, location, minutesToAdd } = action.payload;
      const weatherState = weatherService.updateTime(
        currentState || state, 
        location, 
        minutesToAdd
      );
      
      return {
        ...weatherState,
        visualEffects: weatherService.getVisualEffects(weatherState)
      };
    }
    
    case WEATHER_CHANGE: {
      const { weatherType, intensity } = action.payload;
      const newWeather = {
        type: weatherType,
        intensity: intensity,
        icon: weatherService.getWeatherIcon(weatherType),
        label: weatherService.getWeatherLabel(weatherType)
      };
      
      const newState = {
        ...state,
        weather: newWeather,
        effects: weatherService.calculateEffects(
          state.time.dayPeriod, 
          weatherType, 
          state.season.name
        )
      };
      
      return {
        ...newState,
        visualEffects: weatherService.getVisualEffects(newState)
      };
    }
    
    case SEASON_CHANGE: {
      const { season, day } = action.payload;
      const newSeason = {
        name: season,
        day: day,
        icon: weatherService.getSeasonIcon(season),
        label: weatherService.getSeasonLabel(season)
      };
      
      const newState = {
        ...state,
        season: newSeason,
        time: {
          ...state.time,
          season: season,
          seasonDay: day
        },
        effects: weatherService.calculateEffects(
          state.time.dayPeriod, 
          state.weather.type, 
          season
        )
      };
      
      return {
        ...newState,
        visualEffects: weatherService.getVisualEffects(newState)
      };
    }
    
    case TIME_PERIOD_CHANGE: {
      const { period } = action.payload;
      
      const newState = {
        ...state,
        time: {
          ...state.time,
          dayPeriod: period,
          formattedPeriod: weatherService.getTimePeriodLabel(period)
        },
        effects: weatherService.calculateEffects(
          period, 
          state.weather.type, 
          state.season.name
        )
      };
      
      return {
        ...newState,
        visualEffects: weatherService.getVisualEffects(newState)
      };
    }
    
    case APPLY_WEATHER_EFFECTS: {
      // Этот редьюсер не изменяет состояние погоды,
      // а только предоставляет модифицированного игрока из сервиса.
      // Применение эффектов должно обрабатываться в playerReducer.
      return state;
    }
    
    // Обработка нового типа действия для обновления эффектов погоды из API
    case WEATHER_EFFECTS_UPDATE: {
      return {
        ...state,
        weatherEffects: action.payload || []
      };
    }
    
    default:
      return state;
  }
};

export default weatherReducer;
