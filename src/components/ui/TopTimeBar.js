import React, { useState, useEffect, useReducer } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useGame } from '../../context/GameContext';

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

/**
 * Компонент верхней панели с информацией о времени
 */
function TopTimeBar() {
  const { state: gameState = {} } = useGame() || {};
  const { world = {} } = gameState || {};
  const { time = {} } = world || {};

  const {
    hour = 12,
    minute = 0,
    daytimePeriod = 'afternoon',
    isDayTime = true,
    dayCount = 1
  } = time || {};

  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // Используем useReducer для принудительного перерисовывания компонента
  const [_, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Состояние для анимации обновления
  const [updating, setUpdating] = useState(false);
  const [lastTime, setLastTime] = useState(null);
  
  // Отслеживаем изменения времени для анимации
  useEffect(() => {
    if (lastTime && (lastTime !== formattedTime)) {
      setUpdating(true);
      setTimeout(() => setUpdating(false), 500);
    }
    
    setLastTime(formattedTime);
  }, [formattedTime, lastTime]);
  
  // Принудительное обновление компонента при изменении счетчика в хуке
  useEffect(() => {
    // Обновить компонент при любом изменении данных в хуке
    forceUpdate();
    console.log('🔄 TopTimeBar: Принудительное обновление', {
      time: formattedTime,
      day: dayCount
    });
  }, [formattedTime, dayCount]);
  
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
      
      <DayText>День {dayCount}</DayText>
    </TopBar>
  );
}

export default TopTimeBar;