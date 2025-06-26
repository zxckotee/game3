import React, { useReducer, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import useTimeWeather from '../../hooks/useTimeWeather';

// Стилизованные компоненты для виджета времени и погоды
const WidgetContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 10px 15px;
  color: #fff;
  font-family: 'Arial', sans-serif;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`;

const TimeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeIcon = styled.div`
  font-size: 1.2rem;
  color: ${props => props.isDayTime ? '#FFD700' : '#8A97CD'};
`;

const TimeText = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #eee;
`;

const WeatherSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WeatherIcon = styled.div`
  font-size: 1.2rem;
  color: ${props => {
    switch (props.type) {
      case 'clear': return '#FFD700'; // Золотой
      case 'cloudy': return '#B0C4DE'; // Светло-синий
      case 'rain': return '#4682B4'; // Синий
      case 'thunderstorm': return '#483D8B'; // Темно-синий
      case 'fog': return '#D3D3D3'; // Светло-серый
      case 'snow': return '#F0F8FF'; // Белый с оттенком синего
      default: return '#FFD700';
    }
  }};
`;

const WeatherText = styled.div`
  font-size: 1rem;
`;

const SeasonIndicator = styled.div`
  height: 8px;
  width: 100%;
  background: ${props => {
    switch (props.season) {
      case 'spring': return 'linear-gradient(to right, #C5E8B7, #ABE098, #83D475)'; // Зеленый
      case 'summer': return 'linear-gradient(to right, #FFD700, #FFA500, #FF8C00)'; // Золотой
      case 'autumn': return 'linear-gradient(to right, #D2691E, #CD853F, #B8860B)'; // Коричневый
      case 'winter': return 'linear-gradient(to right, #B0E0E6, #87CEEB, #1E90FF)'; // Голубой
      default: return 'linear-gradient(to right, #C5E8B7, #ABE098, #83D475)';
    }
  }};
  border-radius: 4px;
  margin-top: 8px;
`;

// Маппинг названий погоды на русский язык
const weatherNames = {
  clear: 'Ясно',
  cloudy: 'Облачно',
  rain: 'Дождь',
  thunderstorm: 'Гроза',
  fog: 'Туман',
  snow: 'Снег'
};

// Маппинг времени суток на русский язык
const daytimeNames = {
  dawn: 'Рассвет',
  morning: 'Утро',
  noon: 'Полдень',
  afternoon: 'День',
  evening: 'Вечер',
  night: 'Ночь',
  deepNight: 'Глубокая ночь'
};

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

// Русские названия сезонов
const seasonNames = {
  spring: 'Весна',
  summer: 'Лето',
  autumn: 'Осень',
  winter: 'Зима'
};

/**
 * Компонент для отображения текущего времени, погоды и сезона
 */
function WorldTimeWidget() {
  // Используем хук useTimeWeather для получения синхронизированных данных
  const timeWeather = useTimeWeather();
  
  // Используем useReducer для принудительного перерисовывания компонента
  const [_, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Извлекаем необходимые данные из хука
  const { 
    hour, 
    minute, 
    formattedTime,
    isDayTime,
    daytimePeriod,
    currentWeather, 
    dayCount, 
    season,
    forceUpdateCounter
  } = timeWeather;
  
  // Если нет данных о времени, возвращаем null
  if (hour === undefined && minute === undefined) return null;
  
  // Принудительное обновление компонента при изменении счетчика в хуке
  useEffect(() => {
    forceUpdate();
    console.log('🔄 WorldTimeWidget: Принудительное обновление', {
      forceUpdateCounter, 
      time: formattedTime,
      day: dayCount
    });
  }, [forceUpdateCounter, formattedTime, dayCount]);
  
  return (
    <WidgetContainer>
      <TimeSection>
        <TimeIcon isDayTime={isDayTime}>
          {daytimeIcons[daytimePeriod]}
        </TimeIcon>
        <TimeText>
          {formattedTime} ({daytimeNames[daytimePeriod]})
        </TimeText>
      </TimeSection>
      
      <WeatherSection>
        <WeatherIcon type={currentWeather}>
          {weatherIcons[currentWeather]}
        </WeatherIcon>
        <WeatherText>
          {weatherNames[currentWeather]}
        </WeatherText>
      </WeatherSection>
      
      <div>
        <div>{seasonNames[season]} (день {dayCount})</div>
        <SeasonIndicator season={season} />
      </div>
    </WidgetContainer>
  );
}

export default WorldTimeWidget;
