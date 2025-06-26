import React, { useState, useEffect, useReducer } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useGame } from '../../context/GameContext';
import useTimeWeather from '../../hooks/useTimeWeather';

// Анимации
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
`;

const shine = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Контейнер для верхней панели
const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0 15px;
  height: 40px;
  color: #fff;
`;

// Секция времени
const TimeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
`;

// Динамический индикатор
const LiveIndicator = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #4CAF50;
  position: absolute;
  top: -2px;
  left: -2px;
  animation: ${pulse} 2s infinite ease-in-out;
`;

// Иконка времени
const TimeIcon = styled.div`
  font-size: 1.2rem;
  animation: ${float} 3s infinite ease-in-out;
  transition: all 0.3s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }
`;

// Текст времени
const TimeText = styled.div`
  font-size: 1rem;
  font-weight: bold;
  position: relative;
  
  ${props => props.updating && css`
    animation: ${pulse} 0.5s ease-in-out;
  `}
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, transparent, ${props => props.isDayTime ? '#ffd700' : '#87CEFA'}, transparent);
  }
`;

// Период дня
const DayPeriod = styled.span`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-left: 4px;
  transition: all 0.3s ease;
`;

// Секция погоды
const WeatherSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Иконка погоды
const WeatherIcon = styled.div`
  font-size: 1.2rem;
  animation: ${float} 3s infinite ease-in-out;
  
  /* Особая анимация для разных типов погоды */
  ${props => props.type === 'thunderstorm' && css`
    animation: ${pulse} 1.5s infinite ease-in-out;
  `}
  
  ${props => props.type === 'rain' && css`
    animation: ${float} 2s infinite ease-in-out;
  `}
`;

// Текст погоды
const WeatherText = styled.div`
  font-size: 1rem;
  position: relative;
  
  ${props => props.updating && css`
    animation: ${pulse} 0.5s ease-in-out;
  `}
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(
      to right, 
      transparent, 
      ${props => {
        switch (props.type) {
          case 'clear': return '#FFD700';
          case 'cloudy': return '#B0C4DE';
          case 'rain': return '#4682B4';
          case 'thunderstorm': return '#483D8B';
          case 'fog': return '#D3D3D3';
          case 'snow': return '#F0F8FF';
          default: return '#FFD700';
        }
      }}, 
      transparent
    );
  }
`;

// Текст дня
const DayText = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  position: relative;
  margin-right: 15px;
  
  &::before {
    content: '•';
    position: absolute;
    left: -10px;
    top: 0;
    color: #888;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, transparent, #888, transparent);
  }
`;

// Интенсивность погоды
const WeatherIntensity = styled.span`
  display: inline-block;
  font-size: 0.8rem;
  opacity: 0.8;
  margin-left: 4px;
  
  /* Прогресс-бар интенсивности */
  &::after {
    content: '';
    display: block;
    width: 100%;
    height: 2px;
    margin-top: 1px;
    background: linear-gradient(to right, #444, ${props => {
      switch (props.type) {
        case 'clear': return '#FFD700';
        case 'cloudy': return '#B0C4DE';
        case 'rain': return '#4682B4';
        case 'thunderstorm': return '#483D8B';
        case 'fog': return '#D3D3D3';
        case 'snow': return '#F0F8FF';
        default: return '#FFD700';
      }
    }});
  }
`;

// Иконки для времени суток
const daytimeIcons = {
  dawn: '🌅',
  morning: '🌄',
  noon: '☀️',
  afternoon: '🌞',
  evening: '🌇',
  night: '🌙',
  deepNight: '🌚'
};

// Иконки для погоды
const weatherIcons = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  thunderstorm: '⛈️',
  fog: '🌫️',
  snow: '❄️'
};

// Русские названия времен суток
const daytimeNames = {
  dawn: 'рассвет',
  morning: 'утро',
  noon: 'полдень',
  afternoon: 'день',
  evening: 'вечер',
  night: 'ночь',
  deepNight: 'глубокая ночь'
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
 * Компонент верхней панели с информацией о времени и погоде
 */
function TopTimeWeatherBar() {
  // Используем хук useTimeWeather для получения синхронизированных данных о времени и погоде
  const timeWeather = useTimeWeather();
  
  // Используем useReducer для принудительного перерисовывания компонента
  const [_, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Состояние для анимации обновления
  const [updating, setUpdating] = useState(false);
  const [lastTime, setLastTime] = useState(null);
  const [lastWeather, setLastWeather] = useState(null);
  
  // Используем данные из хука useTimeWeather
  const { 
    hour, 
    minute, 
    formattedTime, 
    isDayTime, 
    daytimePeriod,
    currentWeather,
    weatherIntensity,
    dayCount,
    forceUpdateCounter
  } = timeWeather;
  
  // Отслеживаем изменения времени и погоды для анимации
  useEffect(() => {
    if (lastTime && (lastTime !== formattedTime || lastWeather !== currentWeather)) {
      setUpdating(true);
      setTimeout(() => setUpdating(false), 500);
    }
    
    setLastTime(formattedTime);
    setLastWeather(currentWeather);
  }, [formattedTime, currentWeather, lastTime, lastWeather]);
  
  // Принудительное обновление компонента при изменении счетчика в хуке
  useEffect(() => {
    // Обновить компонент при любом изменении данных в хуке
    forceUpdate();
    console.log('🔄 TopTimeWeatherBar: Принудительное обновление', {
      forceUpdateCounter,
      time: formattedTime,
      day: dayCount
    });
  }, [forceUpdateCounter, formattedTime, dayCount]);
  
  return (
    <TopBar>
      <TimeSection>
        <LiveIndicator />
        <TimeIcon isDayTime={isDayTime}>
          {daytimeIcons[daytimePeriod]}
        </TimeIcon>
        <TimeText updating={updating} isDayTime={isDayTime}>
          {formattedTime}
          <DayPeriod>({daytimeNames[daytimePeriod]})</DayPeriod>
        </TimeText>
      </TimeSection>
      
      <WeatherSection>
        <DayText>День {dayCount}</DayText>
        <WeatherIcon type={currentWeather}>
          {weatherIcons[currentWeather]}
        </WeatherIcon>
        <WeatherText updating={updating} type={currentWeather}>
          {weatherNames[currentWeather]}
          <WeatherIntensity type={currentWeather}>
            ({Math.round(weatherIntensity * 10)}/10)
          </WeatherIntensity>
        </WeatherText>
      </WeatherSection>
    </TopBar>
  );
}

export default TopTimeWeatherBar;
