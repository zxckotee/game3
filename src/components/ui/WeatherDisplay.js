import React from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';

// Стилизованные компоненты
const WeatherContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 15px;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 0.9rem;
`;

const WeatherRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 15px;
`;

const WeatherInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  span {
    color: #d4af37;
  }
`;

const TimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  span {
    color: #d4af37;
  }
`;

const WeatherIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
`;

const TimeIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
`;

const SeasonIndicator = styled.div`
  font-size: 0.8rem;
  color: #aaa;
  text-align: center;
  margin-top: 2px;
`;

/**
 * Компонент для отображения погоды и игрового времени
 */
const WeatherDisplay = () => {
  const { state } = useGame();
  
  // Определяем иконку для времени суток
  const getTimeIcon = () => {
    if (!state.weather || !state.weather.time) {
      // Если нет данных о погоде или времени, используем данные из старой системы
      const hour = state.world.time.hour;
      
      if (hour >= 6 && hour < 12) return '🌅'; // Утро
      if (hour >= 12 && hour < 18) return '☀️'; // День
      if (hour >= 18 && hour < 22) return '🌇'; // Вечер
      return '🌙'; // Ночь
    }
    
    // Новая система - используем данные из состояния погоды
    const period = state.weather.timePeriod;
    
    switch (period) {
      case 'dawn': return '🌅'; // Рассвет
      case 'morning': return '🌄'; // Утро
      case 'day': return '☀️'; // День
      case 'evening': return '🌇'; // Вечер
      case 'dusk': return '🌆'; // Закат
      case 'night': return '🌙'; // Ночь
      case 'midnight': return '🌚'; // Поздняя ночь
      default: return '⏰'; // По умолчанию
    }
  };
  
  // Определяем иконку для текущей погоды
  const getWeatherIcon = () => {
    if (!state.weather || !state.weather.currentWeather) {
      // Если нет данных о погоде, возвращаем ясную погоду
      return '☀️';
    }
    
    const weather = state.weather.currentWeather.type;
    const intensity = state.weather.currentWeather.intensity;
    
    switch (weather) {
      case 'clear': return '☀️'; // Ясно
      case 'cloudy': 
        return intensity > 0.7 ? '☁️' : '🌤️'; // Облачно с разной интенсивностью
      case 'foggy': return '🌫️'; // Туман
      case 'rainy': 
        return intensity > 0.7 ? '🌧️' : '🌦️'; // Дождь с разной интенсивностью
      case 'stormy': return '⛈️'; // Гроза
      case 'snowy': return '❄️'; // Снег
      case 'windy': return '💨'; // Ветер
      case 'heatwave': return '🔥'; // Жара
      case 'blizzard': return '❄️🌬️'; // Метель
      case 'rainbow': return '🌈'; // Радуга
      case 'meteor': return '☄️'; // Метеоритный дождь
      case 'aurora': return '🌌'; // Северное сияние
      case 'bloodMoon': return '🔴'; // Кровавая луна
      default: return '☀️'; // По умолчанию
    }
  };
  
  // Форматирование времени
  const formatTime = () => {
    // Если есть новая система времени, используем её
    if (state.weather && state.weather.time) {
      const { hour, minute } = state.weather.time;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Иначе используем старую систему
    const { hour, minute } = state.world.time;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  // Форматирование названия времени суток
  const getTimeName = () => {
    if (!state.weather || !state.weather.timePeriod) {
      // Если нет данных о времени суток, определяем по часу
      const hour = state.world.time.hour;
      
      if (hour >= 6 && hour < 12) return 'утро';
      if (hour >= 12 && hour < 18) return 'день';
      if (hour >= 18 && hour < 22) return 'вечер';
      return 'ночь';
    }
    
    // Если есть данные о времени суток из новой системы
    const period = state.weather.timePeriod;
    
    switch (period) {
      case 'dawn': return 'рассвет';
      case 'morning': return 'утро';
      case 'day': return 'день';
      case 'evening': return 'вечер';
      case 'dusk': return 'закат';
      case 'night': return 'ночь';
      case 'midnight': return 'полночь';
      default: return 'день';
    }
  };
  
  // Получение названия текущей погоды
  const getWeatherName = () => {
    if (!state.weather || !state.weather.currentWeather) {
      return 'Ясно';
    }
    
    const weather = state.weather.currentWeather.type;
    
    switch (weather) {
      case 'clear': return 'Ясно';
      case 'cloudy': return 'Облачно';
      case 'foggy': return 'Туман';
      case 'rainy': return 'Дождь';
      case 'stormy': return 'Гроза';
      case 'snowy': return 'Снег';
      case 'windy': return 'Ветер';
      case 'heatwave': return 'Жара';
      case 'blizzard': return 'Метель';
      case 'rainbow': return 'Радуга';
      case 'meteor': return 'Метеориты';
      case 'aurora': return 'Сияние';
      case 'bloodMoon': return 'Кровавая луна';
      default: return 'Ясно';
    }
  };
  
  // Получение названия текущего сезона
  const getSeasonName = () => {
    if (!state.weather || !state.weather.season) {
      return null; // Не показываем сезон в старой системе
    }
    
    const season = state.weather.season;
    
    switch (season) {
      case 'spring': return 'Весна';
      case 'summer': return 'Лето';
      case 'autumn': return 'Осень';
      case 'winter': return 'Зима';
      default: return null;
    }
  };
  
  return (
    <WeatherContainer>
      <WeatherRow>
        <TimeInfo>
          <TimeIcon>{getTimeIcon()}</TimeIcon>
          <span>{formatTime()} ({getTimeName()})</span>
        </TimeInfo>
        
        <WeatherInfo>
          <span>{getWeatherName()}</span>
          <WeatherIcon>{getWeatherIcon()}</WeatherIcon>
        </WeatherInfo>
      </WeatherRow>
      
      {getSeasonName() && (
        <SeasonIndicator>{getSeasonName()}</SeasonIndicator>
      )}
    </WeatherContainer>
  );
};

export default WeatherDisplay;
