import React, { useState, useEffect, useMemo, useReducer } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import CombatArea from '../world/CombatArea';
// // import useTimeWeather from '../../hooks/useTimeWeather';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  overflow-x: hidden; /* Предотвращает горизонтальную прокрутку */
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  color: #aaa;
  font-size: 0.8rem;
`;

// Значение
const InfoValue = styled.div`
  color: #f0f0f0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 5px;
`;

// Анимированная иконка
const AnimatedIcon = styled.div`
  font-size: 1.5rem;
  animation: ${fadeInOut} 3s infinite ease-in-out;
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.5s ease-in-out;
  
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
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  width: 100%;
  height: 100%;
  min-height: 500px;
`;

const MapCell = styled.div`
  background: ${props => props.type === 'mountain' ? '#8B4513' :
    props.type === 'forest' ? '#228B22' :
    props.type === 'water' ? '#4682B4' :
    props.type === 'city' ? '#DAA520' :
    props.type === 'dungeon' ? '#800000' : '#556B2F'};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    z-index: 1;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }
  
  ${props => props.isPlayerLocation && `
    &::after {
      content: '●';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 1.2rem;
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    }
  `}
`;

const LocationInfo = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const LocationHeader = styled.div`
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
`;

const LocationName = styled.h2`
  color: #d4af37;
  margin: 0 0 5px;
`;

const LocationType = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const LocationDescription = styled.p`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 20px;
`;

const ResourcesList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const ResourceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
`;

const ResourceLabel = styled.span`
  color: #aaa;
`;

const ResourceValue = styled.span`
  color: #f0f0f0;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.3);
  }
  
  &:disabled {
    background: #333;
    border-color: #666;
    color: #666;
    cursor: not-allowed;
  }
`;

const BackButton = styled(ActionButton)`
  background: rgba(150, 150, 150, 0.2);
  border-color: #aaa;
  color: #aaa;
  
  &:hover {
    background: rgba(150, 150, 150, 0.3);
  }
`;

// Примерные данные для карты, если они отсутствуют в состоянии
const defaultLocations = [
  { id: 1, name: 'Долина Начала', type: 'forest', x: 3, y: 3, description: 'Место, где начинают свой путь молодые культиваторы.', resources: [{ id: 1, name: 'Духовные травы', amount: 'Мало' }] },
  { id: 2, name: 'Горы Облачного Пика', type: 'mountain', x: 5, y: 2, description: 'Высокие горы, окутанные облаками и духовной энергией.', resources: [{ id: 2, name: 'Духовные камни', amount: 'Средне' }] },
  { id: 3, name: 'Город Восточного Ветра', type: 'city', x: 7, y: 5, description: 'Крупный город, центр торговли и культивации.', resources: [{ id: 3, name: 'Товары', amount: 'Много' }] },
  { id: 4, name: 'Озеро Отражений', type: 'water', x: 2, y: 6, description: 'Мистическое озеро, в котором отражаются звезды даже днем.', resources: [{ id: 4, name: 'Водные эссенции', amount: 'Много' }] },
  { id: 5, name: 'Пещера Тысячи Испытаний', type: 'dungeon', x: 8, y: 8, description: 'Древнее место испытаний для культиваторов.', resources: [{ id: 5, name: 'Сокровища', amount: 'Редко' }] },
  { id: 6, name: 'Туманный Лес', type: 'forest', x: 1, y: 1, description: 'Древний лес, окутанный вечным туманом, где растут редкие виды духовных грибов.', resources: [{ id: 6, name: 'Духовные грибы', amount: 'Средне' }] },
  { id: 7, name: 'Вулканический Пик', type: 'mountain', x: 9, y: 2, description: 'Активный вулкан, источающий огненную ци, идеальное место для практиков огненного пути.', resources: [{ id: 7, name: 'Огненные кристаллы', amount: 'Редко' }] },
  { id: 8, name: 'Деревня Речного Камня', type: 'city', x: 4, y: 7, description: 'Небольшое поселение у подножия гор, известное мастерами-ремесленниками и целебными травами.', resources: [{ id: 8, name: 'Редкие рукоделия', amount: 'Много' }] },
  { id: 9, name: 'Ледяное Озеро', type: 'water', x: 6, y: 9, description: 'Озеро, не тающее даже летом, с водой, насыщенной чистейшей инь-энергией.', resources: [{ id: 9, name: 'Инь-эссенция', amount: 'Много' }] },
  { id: 10, name: 'Запретные Руины', type: 'dungeon', x: 2, y: 3, description: 'Древние руины забытой цивилизации, полные опасных ловушек и бесценных артефактов.', resources: [{ id: 10, name: 'Древние артефакты', amount: 'Редко' }] }
];

// Соответствие типов локаций и ID областей для боя
const locationTypeToAreaId = {
  'mountain': 'mountain_path',
  'forest': 'starting_area',
  'dungeon': 'ancient_ruins',
  'city': 'starting_area',
  'water': 'starting_area'
};

function MapTab() {
  const { state, actions } = useGame();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isExploring, setIsExploring] = useState(false);
  const [currentAreaId, setCurrentAreaId] = useState(null);
  
  // Получаем данные о мире и локациях с проверкой на существование
  const world = state?.world || {};
  const playerLocation = state?.player?.location || { x: 3, y: 3 };
  const locations = world?.map?.locations || defaultLocations;
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
    
    // Проверяем, достаточно ли энергии для путешествия
    const distance = Math.abs(selectedLocation.x - playerLocation.x) +
                    Math.abs(selectedLocation.y - playerLocation.y);
    const energyCost = distance * 5;
    
    if ((cultivation.energy || 0) < energyCost) {
      if (actions.addNotification) {
        actions.addNotification({
          message: 'Недостаточно духовной энергии для путешествия',
          type: 'error'
        });
      }
      return;
    }
    
    // Тратим энергию и перемещаем игрока
    if (actions.updateCultivation) {
      actions.updateCultivation({
        energy: (cultivation.energy || 0) - energyCost
      });
    }
    
    if (actions.updateLocation) {
      actions.updateLocation(selectedLocation);
    }
    
    if (actions.addNotification) {
      actions.addNotification({
        message: `Вы успешно переместились в ${selectedLocation.name}`,
        type: 'success'
      });
    }
  };
  
  const handleExplore = () => {
    // Определяем ID области для исследования на основе типа локации
    const locationType = playerLocation.type || 'forest';
    const areaId = locationTypeToAreaId[locationType] || 'starting_area';
    
    setCurrentAreaId(areaId);
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
  
  // Если игрок находится в режиме исследования, показываем CombatArea
  if (isExploring && currentAreaId) {
    return (
      <div>
        <BackButton onClick={() => setIsExploring(false)}>
          Вернуться к карте
        </BackButton>
        <CombatArea areaId={currentAreaId} />
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
          
          <MapGrid>
            {locations.map(location => {
              
              return (
                <MapCell
                  key={location.id}
                  type={location.type}
                  isPlayerLocation={
                    location.x === playerLocation.x &&
                    location.y === playerLocation.y
                  }
                  onClick={() => handleLocationClick(location)}
                />
              );
            })}
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
            
            
            {selectedLocation.x !== playerLocation.x ||
             selectedLocation.y !== playerLocation.y ? (
              <ActionButton
                onClick={handleTravel}
                disabled={(cultivation.energy || 0) < 
                  (Math.abs(selectedLocation.x - playerLocation.x) +
                   Math.abs(selectedLocation.y - playerLocation.y)) * 5}
              >
                Отправиться в путь (
                {(Math.abs(selectedLocation.x - playerLocation.x) +
                  Math.abs(selectedLocation.y - playerLocation.y)) * 5} энергии)
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
