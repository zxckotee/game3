import React, { useEffect, useState, useReducer } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import useTimeWeather from '../../hooks/useTimeWeather';

// Стилизованные компоненты
const ForecastContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #555;
  border-radius: 8px;
  padding: 10px 15px;
  margin-bottom: 15px;
  color: #fff;
`;

const ForecastTitle = styled.h3`
  font-size: 1.1rem;
  color: #ffd700;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  
  span {
    margin-right: 8px;
  }
`;

const ForecastCards = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
  
  /* Стилизация скроллбара */
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(30, 30, 30, 0.6);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(150, 150, 150, 0.6);
    border-radius: 3px;
  }
`;

const WeatherCard = styled.div`
  flex: 0 0 auto;
  min-width: 180px;
  background-color: rgba(50, 50, 50, 0.6);
  border-radius: 6px;
  padding: 12px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: ${props => {
      switch (props.weatherType) {
        case 'clear': return 'linear-gradient(to right, #FFD700, #FFA500)'; // Золотой
        case 'cloudy': return 'linear-gradient(to right, #B0C4DE, #778899)'; // Синевато-серый
        case 'rain': return 'linear-gradient(to right, #4682B4, #1E90FF)'; // Синий
        case 'thunderstorm': return 'linear-gradient(to right, #483D8B, #6A5ACD)'; // Пурпурный
        case 'fog': return 'linear-gradient(to right, #D3D3D3, #A9A9A9)'; // Серый
        case 'snow': return 'linear-gradient(to right, #F0F8FF, #B0E2FF)'; // Голубой
        default: return 'linear-gradient(to right, #FFD700, #FFA500)';
      }
    }};
    border-radius: 6px 6px 0 0;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const WeatherType = styled.div`
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WeatherIcon = styled.span`
  font-size: 1.3rem;
`;

const Intensity = styled.div`
  font-size: 0.85rem;
  color: ${props => {
    // Цвет в зависимости от интенсивности
    return props.value > 100 ? '#FF7F7F' : '#7FFF7F';
  }};
`;

const TimeInfo = styled.div`
  font-size: 0.85rem;
  color: #ccc;
  margin-top: 5px;
`;

const CurrentWeatherFlag = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgba(255, 215, 0, 0.8);
  color: #000;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  transform: rotate(5deg);
`;

// Иконки для погоды
const weatherIcons = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  thunderstorm: '⛈️',
  fog: '🌫️',
  snow: '❄️'
};

// Русские названия погоды
const weatherNames = {
  clear: 'Ясно',
  cloudy: 'Облачно',
  rain: 'Дождь',
  thunderstorm: 'Гроза',
  fog: 'Туман',
  snow: 'Снег'
};

/**
 * Компонент для отображения прогноза погоды
 */
function ForecastWidget() {
  const { state } = useGame();
  const timeWeather = useTimeWeather();
  const [_, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Данные о прогнозе берем СТРОГО из state.weather, чтобы учитывать правильно прогноз погоды
  const weather = state.weather || {};
  const forecast = weather.forecast || [];
  
  // Текущая погода
  const currentWeather = timeWeather.currentWeather;
  const weatherIntensity = timeWeather.weatherIntensity;
  const nextWeatherChange = weather.nextWeatherChange || 0;
  const { actions } = useGame();
  
  // Отслеживаем nextWeatherChange и принудительно меняем погоду, если он равен 0
  useEffect(() => {
    if (nextWeatherChange === 0 && currentWeather) {
      console.log('⚠️ ForecastWidget: Обнаружен нулевой nextWeatherChange, инициируем смену погоды');
      // Принудительно меняем погоду с небольшой задержкой
      const timer = setTimeout(() => {
        actions.dispatch({ type: 'FORCE_WEATHER_CHANGE' });
        console.log('🌦️ ForecastWidget: Выполнена принудительная смена погоды из-за нулевого таймера');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [nextWeatherChange, currentWeather, actions]);
  
  // Обновление при получении нового прогноза погоды
  useEffect(() => {
    forceUpdate();
    console.log('🔄 ForecastWidget: прогноз погоды обновлен', forecast);
  }, [JSON.stringify(forecast)]); // Используем JSON.stringify для правильного отслеживания изменений в массиве
  
  // Если нет прогноза, или если погода инициализируется, возвращаем пустой div
  // ВАЖНО: Возвращаем пустой div вместо null, чтобы количество хуков между рендерами не менялось
  if (!forecast || forecast.length === 0) {
    return <div></div>;
  }
  
  return (
    <ForecastContainer>
      <ForecastTitle>
        <span>🔮</span> Прогноз погоды
      </ForecastTitle>
      
      <ForecastCards>
        {/* Текущая погода */}
        <WeatherCard weatherType={currentWeather}>
          <CurrentWeatherFlag>Текущая погода</CurrentWeatherFlag>
          <CardHeader>
            <WeatherType>
              <WeatherIcon>{weatherIcons[currentWeather]}</WeatherIcon>
              {weatherNames[currentWeather]}
            </WeatherType>
            <Intensity value={Math.min(100, Math.round(weatherIntensity * 100))}>
              {Math.min(100, Math.round(weatherIntensity * 100))}%
            </Intensity>
          </CardHeader>
          <TimeInfo>
            До смены: {nextWeatherChange} мин. игрового времени
          </TimeInfo>
        </WeatherCard>
        
        {/* Прогнозы */}
        {forecast.map((item, index) => (
          <WeatherCard key={index} weatherType={item.type}>
            <CardHeader>
              <WeatherType>
                <WeatherIcon>{weatherIcons[item.type]}</WeatherIcon>
                {weatherNames[item.type]}
              </WeatherType>
              <Intensity value={Math.min(100, Math.round(item.intensity * 100))}>
                {Math.min(100, Math.round(item.intensity * 100))}%
              </Intensity>
            </CardHeader>
            <TimeInfo>
              Через {item.timeToOccur} мин. игрового времени
            </TimeInfo>
            <TimeInfo>
              Продолжительность: {item.duration} мин.
            </TimeInfo>
          </WeatherCard>
        ))}
      </ForecastCards>
    </ForecastContainer>
  );
}

export default ForecastWidget;
