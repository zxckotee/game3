import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { forceWeatherChange } from '../../context/actions/weather-actions';

const DebugContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.8);
  border: 1px solid #555;
  padding: 15px;
  margin-top: 10px;
  border-radius: 5px;
`;

const Title = styled.h3`
  color: #ffcc00;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Row = styled.div`
  display: flex;
  margin-bottom: 10px;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #444;
  }
  
  &:active {
    background-color: #222;
  }
`;

const SmallText = styled.div`
  font-size: 0.8rem;
  color: #999;
  margin-top: 5px;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: bold;
  background-color: ${props => props.error ? '#ff5555' : props.warning ? '#ffaa33' : '#55aa55'};
  color: white;
  margin-left: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
  font-size: 0.9rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  padding: 4px 0;
`;

const Label = styled.span`
  color: #aaa;
`;

const Value = styled.span`
  color: ${props => props.error ? '#ff5555' : props.warning ? '#ffaa33' : '#fff'};
  font-weight: ${props => props.error || props.warning ? 'bold' : 'normal'};
`;

/**
 * Панель отладки погоды для разработчиков
 */
function WeatherDebugPanel() {
  const { state, dispatch } = useGame();
  
  // Информация о текущей погоде
  const weather = state.weather || {};
  const worldTime = state.world?.time || {};
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Обработчик принудительной смены погоды
  const handleForceWeatherChange = () => {
    dispatch(forceWeatherChange());
    console.log('🔄 WeatherDebugPanel: Запрошена принудительная смена погоды');
  };
  
  // Обработчик для принудительной синхронизации дня сезона
  const handleSyncSeasonDay = () => {
    dispatch({ type: 'SYNC_SEASON_DAY' });
    console.log('🔄 WeatherDebugPanel: Запрошена синхронизация дня сезона');
  };
  
  // Автоматически обнаруживает нулевой таймер и меняет погоду
  useEffect(() => {
    // Если таймер погоды равен 0, запускаем принудительную смену погоды
    if (weather.nextWeatherChange === 0) {
      console.log('⚠️ WeatherDebugPanel: Обнаружен нулевой nextWeatherChange, инициируем смену погоды');
      
      // Запускаем принудительную смену погоды с небольшой задержкой
      const timer = setTimeout(() => {
        dispatch(forceWeatherChange());
        console.log('🌦️ WeatherDebugPanel: Выполнена принудительная смена погоды из-за нулевого таймера');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [weather.nextWeatherChange, dispatch]);
  
  // Обновляем компонент каждые 3 секунды для актуализации статусов
  useEffect(() => {
    const timer = setInterval(() => {
      setLastRefresh(Date.now());
    }, 3000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Определяем, является ли таймер погоды проблемным
  const isTimerZero = weather.nextWeatherChange === 0;
  const isTimerLow = weather.nextWeatherChange > 0 && weather.nextWeatherChange < 5;
  
  // Проверяем соответствие дня сезона
  const worldDay = worldTime.day || 1;
  const seasonDay = weather.seasonDay || 1;
  const isSeasonDayMismatch = worldDay !== seasonDay && worldDay <= 30;
  
  return (
    <DebugContainer>
      <Title>
        <span>🧪</span> Отладка погоды
      </Title>
      
      <Row>
        <Button onClick={handleForceWeatherChange}>
          Сменить погоду
        </Button>
        <Button onClick={handleSyncSeasonDay}>
          Синхронизировать сезон
        </Button>
        <div>
          Текущая погода: {weather.currentWeather} ({Math.min(100, Math.round((weather.weatherIntensity || 0) * 100))}%)
        </div>
      </Row>
      
      <Row>
        <div>
          До смены погоды: {weather.nextWeatherChange || 0} мин. игрового времени
          {isTimerZero && <StatusBadge error>ЗАСТРЯЛО НА 0!</StatusBadge>}
          {isTimerLow && <StatusBadge warning>ПОЧТИ 0</StatusBadge>}
        </div>
      </Row>
      
      <InfoGrid>
        <InfoItem>
          <Label>День (world):</Label>
          <Value>{worldTime.day || '?'}</Value>
        </InfoItem>
        <InfoItem>
          <Label>День сезона:</Label>
          <Value error={isSeasonDayMismatch}>{seasonDay} {isSeasonDayMismatch && `(не совпадает с ${worldTime.day})`}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Время (world):</Label>
          <Value>{worldTime.hour || 0}:{String(worldTime.minute || 0).padStart(2, '0')}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Время (weather):</Label>
          <Value>{weather.hour || 0}:{String(weather.minute || 0).padStart(2, '0')}</Value>
        </InfoItem>
        <InfoItem>
          <Label>weatherChangeAt:</Label>
          <Value>{weather.weatherChangeAt || 'undefined'}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Есть прогноз:</Label>
          <Value>{weather.forecast && weather.forecast.length > 0 ? `Да (${weather.forecast.length} элем.)` : 'Нет'}</Value>
        </InfoItem>
      </InfoGrid>
      
      <SmallText>
        Инструмент для тестирования и отладки системы погоды. Панель автоматически отслеживает нулевой таймер и
        синхронизацию дня сезона с общим днем мира. Последнее обновление: {new Date(lastRefresh).toLocaleTimeString()}
      </SmallText>
    </DebugContainer>
  );
}

export default WeatherDebugPanel;
