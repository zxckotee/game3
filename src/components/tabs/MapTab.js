import React, { useState, useEffect, useMemo, useReducer } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import CombatArea from '../world/CombatArea';
import { getUserCombatStatus, forfeitCombat } from '../../services/combat-api';
import { getAllLocations } from '../../services/location-api';
import { enemies } from '../../data/enemies-adapter';
// // import useTimeWeather from '../../hooks/useTimeWeather';

// Импорт функций для безопасного обновления энергии
// В браузере эти функции будут доступны глобально через cultivationBounds.js
const safeUpdateEnergy = window.safeUpdateEnergy || ((current, change, max) => Math.max(0, Math.min(max || 100, (current || 0) + (change || 0))));

// Функция для получения имени врага по ID
const getEnemyNameById = async (enemyId) => {
  // Полный список всех врагов из базы данных (обе группы INSERT запросов)
  const staticEnemyNames = {
    // Первая группа врагов (основные)
    'training_dummy': 'Тренировочный манекен',
    'weak_spirit_beast': 'Слабый духовный зверь',
    'mountain_bandit': 'Горный разбойник',
    'ancient_guardian': 'Древний страж',
    'night_wraith': 'Ночной призрак',
    'lightning_spirit': 'Дух молнии',
    'water_elemental': 'Водный элементаль',
    
    // Вторая группа врагов (новые)
    'swamp_wraith': 'Болотный призрак',
    'poison_toad': 'Ядовитая жаба',
    'mist_spirit': 'Дух тумана',
    'crystal_golem': 'Кристальный голем',
    'cave_bat': 'Пещерная летучая мышь',
    'earth_elemental': 'Земляной элементаль',
    'fire_salamander': 'Огненная саламандра',
    'lava_beast': 'Лавовый зверь',
    'desert_scorpion': 'Пустынный скорпион',
    'ice_wolf': 'Ледяной волк',
    'frost_giant': 'Ледяной великан',
    'blizzard_spirit': 'Дух метели',
    'treant_guardian': 'Страж-энт',
    'forest_drake': 'Лесной дракончик',
    'nature_spirit': 'Дух природы',
    'star_guardian': 'Звездный страж',
    'void_wraith': 'Призрак пустоты',
    'celestial_construct': 'Небесный конструкт'
  };

  // Проверяем статическое сопоставление
  if (staticEnemyNames[enemyId]) {
    return staticEnemyNames[enemyId];
  }

  // Пытаемся найти врага в данных enemies
  try {
    if (typeof enemies.getAllEnemies === 'function') {
      const allEnemies = await enemies.getAllEnemies();
      const enemy = allEnemies.find(e => e.id === enemyId);
      if (enemy && enemy.name) {
        return enemy.name;
      }
    }
  } catch (error) {
    console.warn('[MapTab] Ошибка при получении данных врагов:', error);
  }

  // Fallback - возвращаем null, чтобы вызывающий код мог обработать это
  return null;
};

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  overflow-x: hidden;
  background: linear-gradient(135deg,
    rgba(26, 35, 126, 0.1) 0%,
    rgba(74, 20, 140, 0.1) 25%,
    rgba(144, 19, 254, 0.05) 50%,
    rgba(212, 175, 55, 0.1) 75%,
    rgba(244, 208, 63, 0.05) 100%
  );
  min-height: 100vh;
  padding: 20px;
  border-radius: 16px;
`;

// Анимации
const fadeInOut = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

const shineAnimation = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`;

const rainAnimation = keyframes`
  0% { background-position: 0% 0%; }
  100% { background-position: 20% 100%; }
`;

const snowAnimation = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 10px 100px; }
`;

const fogAnimation = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.7; }
`;

const thunderAnimation = keyframes`
  0%, 95%, 100% { 
    box-shadow: inset 0 0 100vw 0 rgba(255, 255, 255, 0);
  }
  97% {
    box-shadow: inset 0 0 100vw 0 rgba(255, 255, 255, 0.2);
  }
`;

// Стилизованный контейнер для времени суток и погоды
const TimeWeatherPanel = styled.div`
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(212, 175, 55, 0.05) 100%
  );
  backdrop-filter: blur(15px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

// Компонент верхней строки с временем и погодой
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// Колонка с информацией
const InfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

// Метка (заголовок)
const InfoLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

// Значение
const InfoValue = styled.div`
  color: #f4d03f;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

// Анимированная иконка
const AnimatedIcon = styled.div`
  font-size: 1.6rem;
  animation: ${fadeInOut} 3s infinite ease-in-out;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  animation: ${floatAnimation} 3s infinite ease-in-out;
`;

// Прогресс-бар для времени суток
const DayCycleProgress = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress || 0}%;
    background: linear-gradient(to right, 
      #FFC107 0%, 
      #FFD54F 25%, 
      #4FC3F7 50%, 
      #0D47A1 75%, 
      #311B92 100%
    );
    border-radius: 4px;
    transition: width 0.5s ease-in-out;
  }
`;

// Прогресс-бар для сезона
const SeasonProgress = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress || 0}%;
    ${props => {
      switch (props.season) {
        case 'spring':
          return css`background: linear-gradient(to right, #81C784, #C5E1A5, #AED581);`;
        case 'summer':
          return css`background: linear-gradient(to right, #FFD54F, #FFA726, #FF9800);`;
        case 'autumn':
          return css`background: linear-gradient(to right, #A1887F, #8D6E63, #795548);`;
        case 'winter':
          return css`background: linear-gradient(to right, #B3E5FC, #81D4FA, #4FC3F7);`;
        default:
          return css`background: linear-gradient(to right, #81C784, #FFD54F, #A1887F, #B3E5FC);`;
      }
    }}
    border-radius: 4px;
    transition: width 0.5s ease-in-out;
  }
`;

// Информация о сезоне
const SeasonInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
`;

// Название сезона с иконкой
const SeasonName = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 1rem;
  color: ${props => {
    switch (props.season) {
      case 'spring': return '#AED581';
      case 'summer': return '#FFD54F';
      case 'autumn': return '#A1887F';
      case 'winter': return '#81D4FA';
      default: return '#fff';
    }
  }};
`;

// Дни сезона
const SeasonDays = styled.div`
  font-size: 0.9rem;
  color: #aaa;
`;

// Компонент для предстоящих изменений
const UpcomingChange = styled.div`
  font-size: 0.8rem;
  color: #bbb;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  
  span {
    color: #d4af37;
  }
`;

// Эффект мерцания для особых событий
const specialEventShine = css`
  background: linear-gradient(
    to right,
    rgba(255, 215, 0, 0) 0%,
    rgba(255, 215, 0, 0.5) 50%,
    rgba(255, 215, 0, 0) 100%
  );
  background-size: 200% auto;
  animation: ${shineAnimation} 3s linear infinite;
`;

// Контейнер для особого события
const SpecialEventContainer = styled.div`
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px dashed rgba(255, 215, 0, 0.3);
  ${props => props.active && specialEventShine}
`;

// Заголовок особого события
const EventTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: #d4af37;
  margin-bottom: 5px;
`;

// Описание особого события
const EventDescription = styled.div`
  font-size: 0.8rem;
  color: #bbb;
  margin-bottom: 5px;
`;

// Прогресс особого события
const EventProgress = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  margin-top: 5px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => 100 - props.progress || 0}%;
    background: linear-gradient(to right, #d4af37, #ffd700);
    border-radius: 2px;
    transition: width 0.5s ease-in-out;
  }
`;

const WeatherEffectsPanel = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 10px;
  font-size: 0.8rem;
  color: #aaa;
  
  p {
    margin: 5px 0;
  }
  
  span {
    color: ${props => props.positive ? '#a3be8c' : '#bf616a'};
  }
`;

// Иконка для времени суток
const getTimeIcon = (timeOfDay) => {
  switch(timeOfDay) {
    case 'рассвет': return '🌅';
    case 'утро': return '🌄';
    case 'полдень': return '☀️';
    case 'день': return '🌞';
    case 'вечер': return '🌇';
    case 'ночь': return '🌙';
    default: return '⏰';
  }
};

// Иконка для погоды
const getWeatherIcon = (weatherType) => {
  switch(weatherType) {
    case 'Ясно': return '☀️';
    case 'Облачно': return '☁️';
    case 'Дождь': return '🌧️';
    case 'Гроза': return '⛈️';
    case 'Туман': return '🌫️';
    case 'Снег': return '❄️';
    default: return '🌈';
  }
};

// Стилизованная карта с эффектами погоды
const MapArea = styled.div`
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(212, 175, 55, 0.03) 100%
  );
  backdrop-filter: blur(15px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.5s ease-in-out;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      rgba(212, 175, 55, 0.05) 0%,
      transparent 50%,
      rgba(244, 208, 63, 0.05) 100%
    );
    pointer-events: none;
    z-index: 1;
  }
  
  /* Эффект времени суток */
  ${props => {
    switch (props.daytimePeriod) {
      case 'рассвет':
        return css`filter: brightness(0.9) sepia(0.2);`;
      case 'утро':
        return css`filter: brightness(1.1) contrast(1.05);`;
      case 'полдень':
        return css`filter: brightness(1.2) contrast(1.1);`;
      case 'день':
        return css`filter: brightness(1.15) contrast(1.05);`;
      case 'вечер':
        return css`filter: brightness(0.9) sepia(0.15);`;
      case 'ночь':
        return css`filter: brightness(0.7) contrast(1.2) saturate(0.8);`;
      case 'глубокая ночь':
        return css`filter: brightness(0.6) contrast(1.3) saturate(0.7);`;
      default:
        return '';
    }
  }}
  
  /* Эффект сезона */
  ${props => {
    switch (props.season) {
      case 'spring':
        return css`
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(150, 255, 150, 0.05);
            pointer-events: none;
            z-index: 1;
          }
        `;
      case 'summer':
        return css`
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 200, 100, 0.05);
            pointer-events: none;
            z-index: 1;
          }
        `;
      case 'autumn':
        return css`
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 150, 50, 0.05);
            pointer-events: none;
            z-index: 1;
          }
        `;
      case 'winter':
        return css`
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(200, 230, 255, 0.05);
            pointer-events: none;
            z-index: 1;
          }
        `;
      default:
        return '';
    }
  }}
`;

// Оверлей для погодных эффектов
const WeatherOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
`;

// Оверлей для особых событий
const EventOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
  
  ${props => {
    switch (props.event) {
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
          background-image: linear-gradient(to bottom right, transparent 80%, rgba(255, 255, 255, 0.2) 80.5%, transparent 81%);
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
  }}
`;

const MapGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => `repeat(${props.locationCount || 7}, 1fr)`};
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: 520px;
  position: relative;
  z-index: 2;
`;

const MapCell = styled.div`
  background: ${props => props.backgroundImage
    ? `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${props.backgroundImage})`
    : (props.type === 'mountain' ? 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)' :
       props.type === 'forest' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' :
       props.type === 'water' ? 'linear-gradient(135deg, #4682B4 0%, #87CEEB 100%)' :
       props.type === 'city' ? 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)' :
       props.type === 'dungeon' ? 'linear-gradient(135deg, #800000 0%, #A52A2A 100%)' :
       props.type === 'swamp' ? 'linear-gradient(135deg, #556B2F 0%, #6B8E23 100%)' :
       props.type === 'cave' ? 'linear-gradient(135deg, #4A4A4A 0%, #696969 100%)' :
       props.type === 'desert' ? 'linear-gradient(135deg, #CD853F 0%, #DEB887 100%)' :
       props.type === 'tower' ? 'linear-gradient(135deg, #9370DB 0%, #BA55D3 100%)' : 'linear-gradient(135deg, #556B2F 0%, #6B8E23 100%)')};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: scale(1.08) translateY(-4px);
    z-index: 10;
    box-shadow: 0 12px 30px rgba(212, 175, 55, 0.3);
    border-color: rgba(212, 175, 55, 0.6);
    
    &::before {
      left: 100%;
    }
  }
  
  ${props => props.isPlayerLocation && css`
    &::after {
      content: '●';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #f4d03f;
      font-size: 1.4rem;
      text-shadow: 0 0 8px rgba(244, 208, 63, 0.8);
      z-index: 3;
      animation: ${floatAnimation} 2s ease-in-out infinite;
    }
  `}
`;

const LocationInfo = styled.div`
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(212, 175, 55, 0.05) 100%
  );
  backdrop-filter: blur(15px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const LocationHeader = styled.div`
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
  position: relative;
`;

const LocationName = styled.h2`
  background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const LocationType = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin-bottom: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const LocationDescription = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 24px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ResourcesList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
`;

const ResourceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-1px);
  }
`;

const ResourceLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 0.9rem;
`;

const ResourceValue = styled.span`
  color: #f4d03f;
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.1) 100%);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  color: #f4d03f;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.2) 100%);
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: linear-gradient(135deg, rgba(100, 100, 100, 0.2) 0%, rgba(80, 80, 80, 0.1) 100%);
    border-color: rgba(150, 150, 150, 0.3);
    color: rgba(150, 150, 150, 0.6);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &::before {
      display: none;
    }
  }
`;

const BackButton = styled(ActionButton)`
  background: linear-gradient(135deg, rgba(150, 150, 150, 0.2) 0%, rgba(120, 120, 120, 0.1) 100%);
  border-color: rgba(170, 170, 170, 0.4);
  color: rgba(200, 200, 200, 0.9);
  
  &:hover {
    background: linear-gradient(135deg, rgba(150, 150, 150, 0.3) 0%, rgba(120, 120, 120, 0.2) 100%);
    border-color: rgba(170, 170, 170, 0.6);
    box-shadow: 0 6px 20px rgba(150, 150, 150, 0.2);
  }
`;

const EnemiesSection = styled.div`
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
`;

const EnemiesSectionTitle = styled.h4`
  background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 18px 0;
  font-size: 1.1rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
  padding-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const EnemiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EnemyCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.15);
    
    &::before {
      left: 100%;
    }
  }
`;

const EnemyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EnemyName = styled.span`
  color: #f4d03f;
  font-size: 0.95rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const EnemyDetails = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
`;

const EnemyLevel = styled.span`
  color: #f4d03f;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.1) 100%);
  backdrop-filter: blur(3px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const NoEnemiesMessage = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  text-align: center;
  padding: 16px;
  font-style: italic;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;


// Соответствие типов локаций и ID областей для боя
const locationTypeToAreaId = {
  'mountain': 'mountain_path',
  'forest': 'starting_area',
  'swamp': 'misty_swamps',
  'cave': 'crystal_caves',
  'desert': 'burning_wastelands',
  'tower': 'celestial_observatory',
  'dungeon': 'ancient_ruins',
  'city': 'starting_area',
  'water': 'starting_area'
};

function MapTab() {
  const { state, actions } = useGame();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isExploring, setIsExploring] = useState(false);
  const [currentAreaId, setCurrentAreaId] = useState(null);
  const [currentLocationData, setCurrentLocationData] = useState(null);
  
  // Состояния для combat
  const [combatState, setCombatState] = useState(null);
  const [activeEnemy, setActiveEnemy] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Состояния для локаций
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  
  // Получаем данные о мире и игроке с проверкой на существование
  const world = state?.world || {};
  const playerLocation = state?.player?.location || { x: 1, y: 1 }; // Изменено на координаты стартовой локации
  const cultivation = state?.player?.cultivation || {};
  
  // Используем useReducer для принудительного обновления компонента
  const [renderCount, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Используем хук useTimeWeather вместо прямого доступа к state.weather
  const timeWeather = { time: 0, day: 0, season: '', year: 0, timeOfDay: '', daytimePeriod: '', currentSeason: '', daysInSeason: 0, dayCycleProgress: 0, seasonProgress: 0, upcomingChanges: {}, specialEvent: null, weather: null, weatherIntensity: 0, weatherEffects: [], hour: 0, minute: 0, formattedTime: '', isDayTime: true, dayCount: 0, seasonDay: 0, seasonLength: 90, activeEvent: null, eventRemainingTime: 0, nextWeatherChange: 0, forceUpdateCounter: 0, worldTime: 0 };
  
  // Получаем все необходимые данные из хука useTimeWeather
  const { 
    hour, 
    minute, 
    formattedTime, 
    isDayTime, 
    daytimePeriod,
    currentWeather,
    weatherIntensity,
    dayCount,
    season: currentSeason,
    seasonDay,
    seasonLength,
    activeEvent,
    eventRemainingTime,
    nextWeatherChange,
    forceUpdateCounter,
    worldTime // Явно получаем для отслеживания изменений
  } = timeWeather;
  
  // Дополнительные расчеты на основе полученных данных
  const dayProgress = ((hour * 60 + minute) / (24 * 60)) * 100;
  const seasonProgress = (seasonDay / seasonLength) * 100;
  
  // Определяем следующий сезон
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const currentSeasonIndex = seasons.indexOf(currentSeason);
  const nextSeason = seasons[(currentSeasonIndex + 1) % seasons.length];
  
  // Длительность события (если есть)
  const eventDuration = 120; // Примерная длительность события
  const eventProgress = activeEvent ? (eventRemainingTime / eventDuration) * 100 : 0;
  
  // Загрузка локаций из API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        console.log('[MapTab] Загружаем локации из API');
        setLocationsLoading(true);
        
        const fetchedLocations = await getAllLocations();
        
        if (fetchedLocations && fetchedLocations.length > 0) {
          console.log('[MapTab] Локации успешно загружены:', fetchedLocations.length);
          console.log('[MapTab] Структура первой локации:', fetchedLocations[0]);
          setLocations(fetchedLocations);
        } else {
          console.warn('[MapTab] API вернул пустой массив локаций');
          if (actions.addNotification) {
            actions.addNotification({
              message: 'Не удалось загрузить локации с сервера',
              type: 'error'
            });
          }
        }
      } catch (error) {
        console.error('[MapTab] Ошибка загрузки локаций:', error);
        
        if (actions.addNotification) {
          actions.addNotification({
            message: 'Ошибка при загрузке локаций с сервера',
            type: 'error'
          });
        }
      } finally {
        setLocationsLoading(false);
      }
    };
    
    loadLocations();
  }, []); // Загружаем только один раз при монтировании компонента
  
  // Проверка текущего статуса пользователя в Combat при загрузке
  useEffect(() => {
    const checkUserCombatStatus = async () => {
      try {
        console.log('[MapTab] Проверяем текущий статус пользователя в Combat');
        setLoading(true);
        
        const response = await getUserCombatStatus();
        
        console.log('[MapTab] Ответ getUserCombatStatus:', response);
        
        if (response.success && response.inCombat) {
          console.log('[MapTab] Пользователь находится в активном бою:', response);
          
          // Устанавливаем состояние боя
          setCombatState(response.combat);
          
          // Пытаемся определить область из данных боя или используем fallback
          const areaId = response.combat.area_id || response.combat.location_id || 'starting_area';
          setCurrentAreaId(areaId);
          setIsExploring(true);
          
          // Создаем объект врага из данных боя с улучшенной логикой
          if (response.combat.enemy_state || response.combat.enemy_id) {
            const enemyState = response.combat.enemy_state || {};
            
            // Пытаемся восстановить полную информацию о враге
            let enemyName = enemyState.name;
            let enemyLevel = enemyState.enemyLevel || enemyState.level || 1;
            let enemyId = response.combat.enemy_id || 'unknown';
            
            // Если имя отсутствует, пытаемся найти его по ID
            if (!enemyName && enemyId && enemyId !== 'unknown') {
              console.log('[MapTab] Имя врага отсутствует, пытаемся восстановить по ID:', enemyId);
              
              try {
                // Используем новую функцию для получения имени врага
                enemyName = await getEnemyNameById(enemyId);
                
                if (enemyName) {
                  console.log('[MapTab] Успешно восстановлено имя врага:', enemyName);
                } else {
                  console.warn('[MapTab] Не удалось найти имя для ID:', enemyId);
                  enemyName = 'Неизвестный враг';
                }
              } catch (error) {
                console.error('[MapTab] Ошибка при восстановлении имени врага:', error);
                enemyName = 'Неизвестный враг';
              }
            }
            
            // Если все еще нет имени, используем fallback
            if (!enemyName) {
              enemyName = 'Неизвестный враг';
              console.warn('[MapTab] Не удалось определить имя врага, используем fallback');
            }
            
            const restoredEnemy = {
              name: enemyName,
              level: enemyLevel,
              id: enemyId,
              // Добавляем дополнительные данные если они есть
              icon: enemyState.icon || '👹',
              stats: enemyState.stats || enemyState
            };
            
            console.log('[MapTab] Восстановленный объект врага:', restoredEnemy);
            setActiveEnemy(restoredEnemy);
          } else {
            console.warn('[MapTab] Отсутствуют данные о враге в ответе API');
            setActiveEnemy({
              name: 'Неизвестный враг',
              level: 1,
              id: 'unknown',
              icon: '👹'
            });
          }
          
          // Показываем уведомление пользователю
          actions.addNotification({
            message: 'Вы находитесь в активном бою. Перенаправляем...',
            type: 'info'
          });
        } else {
          console.log('[MapTab] Пользователь не находится в активном бою');
        }
      } catch (error) {
        console.error('[MapTab] Ошибка при проверке статуса пользователя:', error);
        actions.addNotification({
          message: 'Ошибка при проверке статуса в Combat',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Проверяем статус пользователя при загрузке компонента
    if (state.player?.id) {
      checkUserCombatStatus();
    }
  }, [state.player?.id]); // Зависимость от ID игрока

  // Подписываемся на события обновления времени для синхронизации с другими компонентами
  useEffect(() => {
    // Функция для принудительного обновления компонента
    const handleTimeUpdate = () => {
      console.log('⏰ MapTab TimeWeatherPanel: Получено событие обновления времени');
      forceUpdate();
    };
    
    // Подписываемся на глобальное событие обновления времени
    window.addEventListener('manual_time_update', handleTimeUpdate);
    
    // При первом рендере сразу обновляем
    forceUpdate();
    console.log('⚡ MapTab TimeWeatherPanel: Инициализация и подписка на обновления', {
      hour,
      minute,
      formattedTime,
      worldTime,
      counter: forceUpdateCounter
    });
    
    // Очищаем обработчик события при размонтировании
    return () => {
      window.removeEventListener('manual_time_update', handleTimeUpdate);
    };
  }, []);
  
  // Также реагируем на прямые изменения в данных
  useEffect(() => {
    forceUpdate();
    console.log('🔄 MapTab TimeWeatherPanel: Обновление из-за изменения данных', {
      hour, 
      minute,
      formattedTime,
      worldTime,
      counter: forceUpdateCounter
    });
  }, [hour, minute, formattedTime, worldTime, forceUpdateCounter]);
  
  // Обработчики событий
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };
  
  const handleTravel = () => {
    if (!selectedLocation) return;
    
    // Используем energyCost из локации
    const energyCost = selectedLocation.energyCost || 0;
    
    // Проверяем требования доступа к локации
    if (selectedLocation.requirements) {
      const requirements = selectedLocation.requirements;
      
      // Проверяем уровень культивации
      if (requirements.cultivation && requirements.cultivation.level) {
        const playerLevel = cultivation.level || 1;
        if (playerLevel < requirements.cultivation.level) {
          if (actions.addNotification) {
            actions.addNotification({
              message: `Для доступа к локации "${selectedLocation.name}" требуется ${requirements.cultivation.level} уровень культивации`,
              type: 'error'
            });
          }
          return;
        }
      }
    }
    
    // Проверяем, достаточно ли энергии для путешествия
    if ((cultivation.energy || 0) < energyCost) {
      if (actions.addNotification) {
        actions.addNotification({
          message: `Недостаточно духовной энергии для путешествия (требуется: ${energyCost})`,
          type: 'error'
        });
      }
      return;
    }
    
    // Безопасно тратим энергию на путешествие с проверкой минимума
    if (actions.updateCultivation) {
      const currentEnergy = cultivation.energy || 0;
      const maxEnergy = cultivation.maxEnergy || 100;
      const newEnergy = safeUpdateEnergy(currentEnergy, -energyCost, maxEnergy);
      
      actions.updateCultivation({
        energy: newEnergy
      });
    }
    
    if (actions.updateLocation) {
      actions.updateLocation(selectedLocation);
    }
    
    if (actions.addNotification) {
      actions.addNotification({
        message: `Вы успешно переместились в ${selectedLocation.name}${energyCost > 0 ? ` (-${energyCost} энергии)` : ''}`,
        type: 'success'
      });
    }
  };
  
  const handleExplore = () => {
    // Находим текущую локацию игрока
    const currentLocation = locations.find(loc =>
      loc.coordinates?.x === playerLocation.x && loc.coordinates?.y === playerLocation.y
    );
    
    // Определяем ID области для исследования
    let areaId;
    if (currentLocation && currentLocation.id) {
      // Используем ID локации напрямую, если он есть в locationTypeToAreaId
      areaId = locationTypeToAreaId[currentLocation.type] || currentLocation.id;
    } else {
      // Fallback на старую логику
      const locationType = playerLocation.type || 'forest';
      areaId = locationTypeToAreaId[locationType] || 'starting_area';
    }
    
    console.log('[MapTab] Исследуем локацию:', {
      currentLocation: currentLocation?.name,
      areaId,
      playerLocation,
      enemies: currentLocation?.enemies
    });
    
    setCurrentAreaId(areaId);
    setCurrentLocationData(currentLocation); // Сохраняем данные локации
    setIsExploring(true);
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
  
  // Русские названия сезонов
  const seasonNames = {
    spring: 'Весна',
    summer: 'Лето',
    autumn: 'Осень',
    winter: 'Зима'
  };
  
  // Иконки для сезонов
  const seasonIcons = {
    spring: '🌱',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️'
  };
  
  // Информация о событиях
  const eventInfo = {
    bloom: {
      name: 'Цветение духовных трав',
      description: 'Духовные травы цветут, повышая их эффективность и количество.',
      icon: '🌸'
    },
    spirit_tide: {
      name: 'Прилив духовной энергии',
      description: 'Повышенная концентрация духовной энергии ускоряет культивацию.',
      icon: '🌊'
    },
    solstice: {
      name: 'Солнцестояние',
      description: 'Пик солнечной активности усиливает огненную культивацию.',
      icon: '☀️'
    },
    meteor_shower: {
      name: 'Метеоритный дождь',
      description: 'Падающие звезды приносят редкие космические материалы.',
      icon: '☄️'
    },
    harvest: {
      name: 'Сбор урожая',
      description: 'Время собирать плоды и готовиться к зиме.',
      icon: '🌾'
    },
    spirit_wind: {
      name: 'Духовный ветер',
      description: 'Сильные ветра делают передвижение легче.',
      icon: '🌬️'
    },
    ice_tribulation: {
      name: 'Ледяная трибуляция',
      description: 'Испытание льдом и холодом для культиваторов.',
      icon: '❄️'
    },
    blizzard: {
      name: 'Метель',
      description: 'Сильный снегопад затрудняет передвижение.',
      icon: '🌨️'
    }
  };
  
  // Обработчик возврата к карте с поддержкой принудительного завершения боя
  const handleReturnToMap = async () => {
    console.log('[MapTab] handleReturnToMap вызван', {
      combatState: combatState,
      combatId: combatState?.id,
      combatStatus: combatState?.status,
      isExploring,
      currentAreaId
    });

    // Проверяем наличие активного боя более тщательно
    if (combatState && combatState.id && (combatState.status === 'active' || combatState.status === 'ongoing')) {
      try {
        console.log('[MapTab] Принудительное завершение активного боя:', {
          combatId: combatState.id,
          status: combatState.status,
          enemy: activeEnemy?.name
        });
        
        const result = await forfeitCombat(combatState.id);
        
        console.log('[MapTab] Результат forfeitCombat:', result);
        
        if (result.success) {
          actions.addNotification({
            message: 'Вы сдались и покинули бой',
            type: 'warning'
          });
          console.log('[MapTab] Бой успешно завершен с поражением игрока');
        } else {
          console.error('[MapTab] Ошибка при завершении боя:', result);
          actions.addNotification({
            message: `Ошибка при выходе из боя: ${result.message || 'Неизвестная ошибка'}`,
            type: 'error'
          });
          
          // Даже если API вернул ошибку, все равно сбрасываем локальное состояние
          console.log('[MapTab] Принудительный сброс состояния несмотря на ошибку API');
        }
      } catch (error) {
        console.error('[MapTab] Исключение при принудительном завершении боя:', error);
        actions.addNotification({
          message: 'Произошла ошибка при выходе из боя. Состояние сброшено принудительно.',
          type: 'warning'
        });
        
        // Даже при исключении сбрасываем состояние
        console.log('[MapTab] Принудительный сброс состояния несмотря на исключение');
      }
    } else {
      console.log('[MapTab] Нет активного боя для завершения или некорректное состояние', {
        hasCombatState: !!combatState,
        combatId: combatState?.id,
        status: combatState?.status
      });
    }
    
    // Сброс всех состояний боя (выполняется всегда)
    console.log('[MapTab] Сброс всех состояний боя');
    setCombatState(null);
    setActiveEnemy(null);
    setIsExploring(false);
    setCurrentAreaId(null);
    setCurrentLocationData(null);
    
    console.log('[MapTab] Возврат к карте завершен');
  };

  // Обработчик уведомлений о начале боя от CombatArea
  const handleCombatStateChange = (newCombatState, newActiveEnemy) => {
    console.log('[MapTab] Получено уведомление о начале боя:', {
      combatState: newCombatState,
      enemy: newActiveEnemy
    });
    
    // Синхронизируем состояние боя в MapTab
    setCombatState(newCombatState);
    setActiveEnemy(newActiveEnemy);
  };

  // Если игрок находится в режиме исследования, показываем CombatArea
  if (isExploring && currentAreaId) {
    return (
      <div>
        <BackButton onClick={handleReturnToMap}>
          Вернуться к карте
        </BackButton>
        <CombatArea
          areaId={currentAreaId}
          existingCombat={combatState}
          activeEnemy={activeEnemy}
          onForcedExit={handleReturnToMap}
          onCombatStateChange={handleCombatStateChange}
          locationData={currentLocationData}
        />
      </div>
    );
  }
  
  return (
    <Container>
      <div>
        
        <MapArea 
          daytimePeriod={daytimePeriod} 
          season={currentSeason}
        >

          
          {/* Оверлей событий */}
          {activeEvent && <EventOverlay event={activeEvent} />}
          
          <MapGrid locationCount={locations.length}>
            {locationsLoading ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: '#aaa',
                padding: '50px',
                fontSize: '1.1rem'
              }}>
                Загрузка локаций...
              </div>
            ) : locations.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: '#ff6b6b',
                padding: '50px',
                fontSize: '1.1rem'
              }}>
                Локации не загружены
              </div>
            ) : (
              locations.map(location => {
                console.log('[MapTab] Рендерим локацию:', location.name, 'с координатами:', location.coordinates);
                return (
                  <MapCell
                    key={location.id}
                    type={location.type}
                    backgroundImage={location.backgroundImage}
                    isPlayerLocation={
                      location.coordinates?.x === playerLocation.x &&
                      location.coordinates?.y === playerLocation.y
                    }
                    onClick={() => handleLocationClick(location)}
                  />
                );
              })
            )}
          </MapGrid>
        </MapArea>
      </div>
      
      <LocationInfo>
        {selectedLocation ? (
          <>
            <LocationHeader>
              <LocationName>{selectedLocation.name}</LocationName>
              <LocationType>
                {selectedLocation.type === 'mountain' && 'Горы'}
                {selectedLocation.type === 'forest' && 'Лес'}
                {selectedLocation.type === 'water' && 'Водоем'}
                {selectedLocation.type === 'city' && 'Город'}
                {selectedLocation.type === 'dungeon' && 'Подземелье'}
              </LocationType>
            </LocationHeader>
            
            <LocationDescription>
              {selectedLocation.description}
            </LocationDescription>
            
            {selectedLocation.requirements && Object.keys(selectedLocation.requirements).length > 0 && (
              <div style={{ margin: '10px 0', padding: '8px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                <div style={{ color: '#ffd700', fontSize: '14px', marginBottom: '5px' }}>Требования для доступа:</div>
                {selectedLocation.requirements.minLevel && (
                  <div style={{ color: '#ccc', fontSize: '12px' }}>
                    Минимальный уровень: {selectedLocation.requirements.minLevel}
                  </div>
                )}
                {selectedLocation.requirements.completedLocations && selectedLocation.requirements.completedLocations.length > 0 && (
                  <div style={{ color: '#ccc', fontSize: '12px' }}>
                    Завершить локации: {selectedLocation.requirements.completedLocations.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            {selectedLocation.effects && Object.keys(selectedLocation.effects).length > 0 && (
              <div style={{ margin: '10px 0', padding: '8px', backgroundColor: '#1a3a1a', borderRadius: '4px' }}>
                <div style={{ color: '#90ee90', fontSize: '14px', marginBottom: '5px' }}>Эффекты локации:</div>
                {selectedLocation.effects.experienceBonus && (
                  <div style={{ color: '#ccc', fontSize: '12px' }}>
                    Бонус опыта: +{selectedLocation.effects.experienceBonus}%
                  </div>
                )}
                {selectedLocation.effects.dropRateBonus && (
                  <div style={{ color: '#ccc', fontSize: '12px' }}>
                    Бонус дропа: +{selectedLocation.effects.dropRateBonus}%
                  </div>
                )}
                {selectedLocation.effects.energyRegenBonus && (
                  <div style={{ color: '#ccc', fontSize: '12px' }}>
                    Бонус восстановления энергии: +{selectedLocation.effects.energyRegenBonus}%
                  </div>
                )}
              </div>
            )}
            
            {/* Секция отображения врагов */}
            {selectedLocation.enemies && (
              <EnemiesSection>
                <EnemiesSectionTitle>Враги в локации</EnemiesSectionTitle>
                {selectedLocation.enemies.length > 0 ? (
                  <EnemiesList>
                    {selectedLocation.enemies.map((enemy, index) => (
                      <EnemyCard key={enemy.id || index}>
                        <EnemyInfo>
                          <EnemyName>{enemy.name || enemy.id}</EnemyName>
                          <EnemyDetails>
                            {enemy.description && enemy.description.length > 50
                              ? `${enemy.description.substring(0, 50)}...`
                              : enemy.description || 'Описание отсутствует'}
                          </EnemyDetails>
                          {enemy.spawnChance && (
                            <EnemyDetails>Шанс появления: {Math.round(enemy.spawnChance * 100)}%</EnemyDetails>
                          )}
                        </EnemyInfo>
                        <EnemyLevel>
                          Ур. {enemy.level || '?'}
                        </EnemyLevel>
                      </EnemyCard>
                    ))}
                  </EnemiesList>
                ) : (
                  <NoEnemiesMessage>
                    В этой локации пока нет врагов
                  </NoEnemiesMessage>
                )}
              </EnemiesSection>
            )}
            
            {selectedLocation.coordinates?.x !== playerLocation.x ||
             selectedLocation.coordinates?.y !== playerLocation.y ? (
              <ActionButton
                onClick={handleTravel}
                disabled={(cultivation.energy || 0) < (selectedLocation.energyCost || 0)}
              >
                Отправиться в путь ({selectedLocation.energyCost || 0} энергии)
              </ActionButton>
            ) : (
              <ActionButton onClick={handleExplore}>
                Исследовать местность
              </ActionButton>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa' }}>
            Выберите локацию для просмотра деталей
          </div>
        )}
      </LocationInfo>
    </Container>
  );
}

export default MapTab;
