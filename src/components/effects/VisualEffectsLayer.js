import React, { useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useGame } from '../../context/GameContext';

// Анимации для эффектов погоды
const rainAnimation = keyframes`
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 20% 100%;
  }
`;

const snowAnimation = keyframes`
  0% {
    background-position: 0px 0px;
  }
  100% {
    background-position: 500px 1000px, 400px 400px;
  }
`;

const fogAnimation = keyframes`
  0% {
    opacity: 0.5;
    transform: translateX(-5%) translateY(0);
  }
  50% {
    opacity: 0.55;
    transform: translateX(0) translateY(0);
  }
  100% {
    opacity: 0.5;
    transform: translateX(5%) translateY(0);
  }
`;

const thunderAnimation = keyframes`
  0% {
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  20% {
    opacity: 0;
  }
  30% {
    opacity: 0;
  }
  40% {
    opacity: 0.4;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
`;

// Стилизованный контейнер с визуальными эффектами
const EffectsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  transition: all 1s ease-in-out;
  
  /* Фильтры для времени суток и погоды */
  ${props => {
    let filter = '';
    
    // Применяем фильтры времени суток
    switch (props.daytimePeriod) {
      case 'dawn':
        filter += 'brightness(0.9) sepia(0.2)';
        break;
      case 'morning':
        filter += 'brightness(1.1) contrast(1.05)';
        break;
      case 'noon':
        filter += 'brightness(1.2) contrast(1.1)';
        break;
      case 'afternoon':
        filter += 'brightness(1.15) contrast(1.05)';
        break;
      case 'evening':
        filter += 'brightness(0.9) sepia(0.15)';
        break;
      case 'night':
        filter += 'brightness(0.7) contrast(1.2) saturate(0.8)';
        break;
      case 'deepNight':
        filter += 'brightness(0.6) contrast(1.3) saturate(0.7)';
        break;
      default:
        filter += 'brightness(1) contrast(1)';
    }
    
    return `filter: ${filter};`;
  }}
`;

// Компонент оверлея для эффектов погоды
const WeatherOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  ${props => {
    // Эффекты в зависимости от погоды
    switch (props.weatherType) {
      case 'rain':
        return css`
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><line x1="20" y1="0" x2="10" y2="30" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/><line x1="30" y1="10" x2="20" y2="40" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/><line x1="40" y1="0" x2="30" y2="30" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/><line x1="50" y1="5" x2="40" y2="35" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/><line x1="60" y1="0" x2="50" y2="30" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/><line x1="70" y1="10" x2="60" y2="40" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/><line x1="80" y1="0" x2="70" y2="30" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/><line x1="90" y1="5" x2="80" y2="35" stroke="rgba(200, 200, 255, 0.5)" stroke-width="1"/></svg>');
          background-repeat: repeat;
          opacity: ${props.intensity * 0.7};
          animation: ${rainAnimation} 0.5s linear infinite;
        `;
      case 'snow':
        return css`
          background-image: 
            radial-gradient(circle at 50% 50%, white 0.5px, transparent 1px),
            radial-gradient(circle at 70% 30%, white 0.5px, transparent 1px);
          background-size: 100px 100px, 150px 150px;
          opacity: ${props.intensity * 0.5};
          animation: ${snowAnimation} 20s linear infinite;
        `;
      case 'fog':
        return css`
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.2));
          opacity: ${props.intensity * 0.5};
          animation: ${fogAnimation} 20s ease-in-out infinite;
        `;
      case 'thunderstorm':
        return css`
          background-color: rgba(255, 255, 255, 0);
          box-shadow: inset 0 0 100vw 0 rgba(255, 255, 255, 0);
          animation: ${thunderAnimation} ${10 + Math.random() * 20}s ease-out infinite;
          opacity: ${props.intensity * 0.2};
        `;
      case 'cloudy':
        return css`
          background-image: 
            radial-gradient(circle at 30% 40%, rgba(220, 220, 220, 0.3) 20px, transparent 30px),
            radial-gradient(circle at 70% 50%, rgba(220, 220, 220, 0.3) 30px, transparent 40px);
          background-size: 200px 200px;
          opacity: ${props.intensity * 0.3};
        `;
      default:
        return '';
    }
  }}
`;

// Компонент для особых эффектов
const SpecialEffectsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 101;
  
  ${props => {
    // Особые эффекты в зависимости от события
    if (props.specialEvent) {
      switch (props.specialEvent) {
        case 'bloom':
          return css`
            box-shadow: inset 0 0 100px rgba(255, 230, 230, 0.3);
            background: 
              radial-gradient(circle at 30% 40%, rgba(255, 200, 200, 0.1) 0px, transparent 100px),
              radial-gradient(circle at 70% 60%, rgba(255, 200, 200, 0.1) 0px, transparent 100px);
          `;
        case 'spirit_tide':
          return css`
            background: linear-gradient(to bottom, 
              rgba(100, 150, 255, 0.05) 0%, 
              rgba(100, 200, 255, 0.1) 50%, 
              rgba(100, 150, 255, 0.05) 100%);
          `;
        case 'solstice':
          return css`
            box-shadow: inset 0 0 150px rgba(255, 200, 100, 0.3);
          `;
        case 'meteor_shower':
          return css`
            background-image: linear-gradient(to bottom right, rgba(255, 255, 255, 0) 80%, rgba(255, 255, 255, 0.2) 80.5%, rgba(255, 255, 255, 0) 81%);
            background-size: 200px 200px;
            animation: ${rainAnimation} 1s linear infinite;
          `;
        case 'ice_tribulation':
          return css`
            background: radial-gradient(circle at center, rgba(200, 230, 255, 0.1) 0%, transparent 100%);
            box-shadow: inset 0 0 100px rgba(200, 230, 255, 0.2);
          `;
        case 'blizzard':
          return css`
            background-image: 
              radial-gradient(circle at 50% 50%, white 1px, transparent 2px),
              radial-gradient(circle at 70% 30%, white 1px, transparent 2px);
            background-size: 50px 50px, 70px 70px;
            opacity: 0.7;
            animation: ${snowAnimation} 5s linear infinite;
          `;
        default:
          return '';
      }
    }
    return '';
  }}
`;

// Компонент для сезонных визуальных эффектов
const SeasonalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.2;
  
  ${props => {
    // Эффекты в зависимости от сезона
    switch (props.season) {
      case 'spring':
        return css`
          box-shadow: inset 0 0 200px rgba(150, 255, 150, 0.1);
        `;
      case 'summer':
        return css`
          box-shadow: inset 0 0 200px rgba(255, 200, 100, 0.1);
        `;
      case 'autumn':
        return css`
          box-shadow: inset 0 0 200px rgba(255, 150, 50, 0.1);
        `;
      case 'winter':
        return css`
          box-shadow: inset 0 0 200px rgba(200, 230, 255, 0.1);
        `;
      default:
        return '';
    }
  }}
`;

// Компонент для локационных эффектов
const LocationEffectsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  ${props => {
    // Эффекты в зависимости от локации
    if (props.location) {
      const locationEffects = {
        'lake_of_reflections': css`
          background: linear-gradient(to bottom, rgba(100, 200, 255, 0.03) 0%, rgba(100, 150, 255, 0.05) 100%);
        `,
        'fire_mountain': css`
          box-shadow: inset 0 0 200px rgba(255, 100, 50, 0.1);
        `,
        'wind_plains': css`
          opacity: 0.1;
          background-image: linear-gradient(to right, transparent 90%, rgba(200, 200, 255, 0.2) 100%);
          background-size: 100px 100%;
          animation: ${fogAnimation} 30s linear infinite;
        `,
        'spirit_forest': css`
          background-image: 
            radial-gradient(circle at 30% 40%, rgba(150, 255, 150, 0.1) 0px, transparent 50px),
            radial-gradient(circle at 70% 60%, rgba(150, 255, 150, 0.1) 0px, transparent 50px);
        `,
        'frozen_peaks': css`
          box-shadow: inset 0 0 150px rgba(200, 230, 255, 0.1);
        `,
        'desert_of_trials': css`
          background: linear-gradient(to bottom, rgba(255, 200, 100, 0.05) 0%, rgba(255, 150, 50, 0.03) 100%);
        `
      };
      
      // Получаем ID локации
      const locationId = props.location.id || 'unknown';
      
      // Возвращаем стиль для локации или пустую строку, если эффекта нет
      return locationEffects[locationId] || '';
    }
    return '';
  }}
`;

/**
 * Компонент для визуальных эффектов погоды, времени суток и сезонов
 */
function VisualEffectsLayer() {
  const { state } = useGame();
  
  // Получаем данные о погоде и времени
  const weather = state.weather || {};
  const worldState = state.world || {};
  const currentLocation = worldState.currentLocation || {};
  
  // Вычисляем период суток, если его нет
  const daytimePeriod = useMemo(() => {
    const hour = weather.hour !== undefined ? weather.hour : (worldState.time?.hour || 12);
    
    if (weather.daytimePeriod) return weather.daytimePeriod;
    
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 23) return 'night';
    return 'deepNight';
  }, [weather, worldState.time]);
  
  // Получаем текущую погоду
  const currentWeather = weather.currentWeather || 'clear';
  
  // Получаем интенсивность погоды
  const weatherIntensity = weather.weatherIntensity || 1.0;
  
  // Получаем активное особое событие
  const specialEvent = weather.activeEvent || null;
  
  // Получаем текущий сезон
  const currentSeason = weather.currentSeason || 'spring';
  
  return (
    <EffectsContainer daytimePeriod={daytimePeriod}>
      {/* Наложение эффектов погоды */}
      <WeatherOverlay 
        weatherType={currentWeather} 
        intensity={weatherIntensity} 
      />
      
      {/* Наложение сезонных эффектов */}
      <SeasonalOverlay season={currentSeason} />
      
      {/* Наложение особых событий */}
      {specialEvent && (
        <SpecialEffectsOverlay specialEvent={specialEvent} />
      )}
      
      {/* Наложение локационных эффектов */}
      <LocationEffectsOverlay location={currentLocation} />
    </EffectsContainer>
  );
}

export default VisualEffectsLayer;
