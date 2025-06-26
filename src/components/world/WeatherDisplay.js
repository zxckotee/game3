import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useGameContext } from '../../context/GameContext';
import { updateGameTime } from '../../context/actions/weather-actions';

// Стилизованные компоненты для отображения погоды
const WeatherContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  margin-bottom: 10px;
  color: #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TimeContainer = styled.div`
  margin-right: 15px;
  text-align: center;
`;

const Time = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
`;

const TimeOfDay = styled.div`
  font-size: 0.8rem;
  opacity: 0.9;
`;

const WeatherIcon = styled.div`
  width: 32px;
  height: 32px;
  margin-right: 10px;
  background-image: url(${props => props.icon});
  background-size: contain;
  background-repeat: no-repeat;
`;

const WeatherInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const WeatherType = styled.div`
  font-weight: bold;
  display: flex;
  align-items: center;
`;

const IntensityIndicator = styled.div`
  display: inline-block;
  width: 50px;
  height: 6px;
  background: linear-gradient(to right, 
    ${props => props.intensity > 0 ? '#3498db' : 'transparent'}, 
    ${props => props.intensity > 2 ? '#2ecc71' : 'transparent'}, 
    ${props => props.intensity > 4 ? '#f1c40f' : 'transparent'}, 
    ${props => props.intensity > 6 ? '#e67e22' : 'transparent'}, 
    ${props => props.intensity > 8 ? '#e74c3c' : 'transparent'}
  );
  border-radius: 3px;
  margin-left: 10px;
`;

const EffectsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 4px;
  font-size: 0.8rem;
`;

const Effect = styled.div`
  padding: 2px 5px;
  margin-right: 5px;
  margin-bottom: 3px;
  border-radius: 3px;
  background-color: ${props => props.isPositive ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'};
  border: 1px solid ${props => props.isPositive ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)'};
`;

const WeatherDisplay = () => {
  const { state, actions } = useGameContext();
  
  // Получаем данные о погоде из правильного места в состоянии (state.world)
  const worldState = state.world || {};
  
  // Перевод типов погоды с английского на русский
  const translateWeatherType = (englishType) => {
    // Проверяем, что englishType - строка, прежде чем вызывать toLowerCase()
    if (typeof englishType !== 'string') {
      return 'Ясно'; // Возвращаем дефолтное значение, если тип не строка
    }
    
    const translations = {
      'clear': 'Ясно',
      'cloudy': 'Облачно',
      'rain': 'Дождь',
      'storm': 'Гроза',
      'snow': 'Снег',
      'fog': 'Туман'
    };
    return translations[englishType.toLowerCase()] || englishType || 'Ясно';
  };
  
  const weather = {
    weatherType: translateWeatherType(worldState.weather),
    weatherIntensity: worldState.weatherIntensity || 0,
    timeOfDay: getTimeOfDay(worldState.time),
    formattedTime: formatTime(worldState.time),
    weatherEffects: worldState.weatherEffects || {}
  };
  
  // Форматирование времени
  function formatTime(time) {
    if (!time || time.hour === undefined || time.minute === undefined) {
      return "00:00";
    }
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
  }
  
  // Определение времени суток
  function getTimeOfDay(time) {
    if (!time || time.hour === undefined) return "День";
    
    const hour = time.hour;
    if (hour >= 5 && hour < 12) return "Утро";
    if (hour >= 12 && hour < 18) return "День";
    if (hour >= 18 && hour < 22) return "Вечер";
    return "Ночь";
  }
  
  // Запускаем таймер обновления погоды
  useEffect(() => {
    // Обновляем время каждую минуту
    const intervalId = setInterval(() => {
      // Получаем текущее время из состояния (или используем дефолтные значения)
      const currentMinute = worldState.time?.minute || 0;
      const currentHour = worldState.time?.hour || 0;
      
      // Вычисляем новые значения времени
      const newMinute = (currentMinute + 1) % 60;
      const newHour = (currentMinute + 1 >= 60) 
        ? (currentHour + 1) % 24
        : currentHour;
      
      // Получаем текущий день
      const currentDay = worldState.time?.day || 1;
      
      // Проверяем, есть ли переход через полночь (с 23:59 на 0:00)
      const midnightTransition = (currentHour === 23 && newHour === 0);
      
      // Если переход через полночь, увеличиваем день
      const newDay = midnightTransition ? currentDay + 1 : currentDay;
      
      // Вызываем действие для обновления времени с указанием дня
      actions.updateTime({
        minute: newMinute,
        hour: newHour,
        day: newDay, // Обязательно передаем день
        season: worldState.time?.season // Сохраняем текущий сезон
      });
    }, 1000); // 1 секунда реального времени = 1 минута игрового времени
    
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [actions, worldState.time]);
  
  // Если данные о погоде еще не загружены, показываем заглушку
  if (!weather.weatherType || !weather.formattedTime) {
    return (
      <WeatherContainer>
        <TimeContainer>
          <Time>??:??</Time>
          <TimeOfDay>Загрузка...</TimeOfDay>
        </TimeContainer>
      </WeatherContainer>
    );
  }
  
  // Получение иконки для текущей погоды
  const getWeatherIcon = () => {
    const basePath = '/assets/images/weather/';
    switch(weather.weatherType) {
      case 'дождь': return `${basePath}rain.png`;
      case 'гроза': return `${basePath}storm.png`;
      case 'туман': return `${basePath}fog.png`;
      case 'снег': return `${basePath}snow.png`;
      case 'облачно': return `${basePath}cloudy.png`;
      default: return `${basePath}sunny.png`;
    }
  };
  
  // Получение словесного описания интенсивности с ограничением до 100%
  const getIntensityDescription = (intensity) => {
    intensity = intensity || 0; // Default to 0 to prevent NaN
    
    // Нормализация интенсивности до 0-10 шкалы для словесного описания
    const normalizedIntensity = Math.min(intensity, 1.0) * 10;
    
    if (normalizedIntensity <= 2) return 'Слабый ветер';
    if (normalizedIntensity <= 5) return 'Умеренный ветер';
    if (normalizedIntensity <= 8) return 'Сильный ветер';
    return 'Экстремальный ветер';
  };
  
  // Рендеринг основных эффектов погоды (показываем только 3 самых значимых)
  const renderWeatherEffects = () => {
    const effects = [];
    const { weatherEffects } = weather;
    
    if (!weatherEffects) return null;
    
    // Эффекты культивации по стихиям
    for (const element in weatherEffects.cultivation?.elementModifiers || {}) {
      const value = weatherEffects.cultivation?.elementModifiers[element];
      if (value !== 1.0) {
        effects.push({
          text: `${value > 1.0 ? '+' : ''}${Math.round((value - 1.0) * 100)}% культивация ${getElementName(element)}`,
          isPositive: value > 1.0,
          value: Math.abs(value - 1.0)
        });
      }
    }
    
  // Эффект медитации
    if (weatherEffects.cultivation?.meditationEfficiencyModifier !== 1.0) {
      const value = weatherEffects.cultivation?.meditationEfficiencyModifier || 1.0;
      effects.push({
        text: `${value > 1.0 ? '+' : ''}${Math.round((value - 1.0) * 100)}% к медитации`,
        isPositive: value > 1.0,
        value: Math.abs(value - 1.0)
      });
    }
    
    // Эффекты боя по стихиям
    for (const element in weatherEffects.combat?.damageModifiers || {}) {
      const value = weatherEffects.combat?.damageModifiers[element] || 1.0;
      if (value !== 1.0) {
        effects.push({
          text: `${value > 1.0 ? '+' : ''}${Math.round((value - 1.0) * 100)}% урон ${getElementName(element)}`,
          isPositive: value > 1.0,
          value: Math.abs(value - 1.0)
        });
      }
    }
    
    // Прочие эффекты боя
    if (weatherEffects.combat?.critChanceModifier !== 1.0) {
      const value = weatherEffects.combat?.critChanceModifier || 1.0;
      effects.push({
        text: `${value > 1.0 ? '+' : ''}${Math.round((value - 1.0) * 100)}% шанс крита`,
        isPositive: value > 1.0,
        value: Math.abs(value - 1.0)
      });
    }
    
    // Эффект на видимость
    if (weatherEffects.exploration?.visibilityModifier !== 1.0) {
      const value = weatherEffects.exploration?.visibilityModifier || 1.0;
      effects.push({
        text: `${value > 1.0 ? '+' : ''}${Math.round((value - 1.0) * 100)}% видимость`,
        isPositive: value > 1.0,
        value: Math.abs(value - 1.0)
      });
    }
    
    // Эффекты исследования
    if (weatherEffects.exploration?.resourceFindRateModifier !== 1.0) {
      const value = weatherEffects.exploration?.resourceFindRateModifier || 1.0;
      effects.push({
        text: `${value > 1.0 ? '+' : ''}${Math.round((value - 1.0) * 100)}% шанс ресурсов`,
        isPositive: value > 1.0,
        value: Math.abs(value - 1.0)
      });
    }
    
    // Затраты энергии
    if (weatherEffects.exploration?.movementEnergyCostModifier !== 1.0) {
      const value = weatherEffects.exploration?.movementEnergyCostModifier || 1.0;
      effects.push({
        text: `${value > 1.0 ? '+' : ''}${Math.round((value - 1.0) * 100)}% затраты энергии`,
        isPositive: value < 1.0,  // Для затрат энергии меньше - лучше
        value: Math.abs(value - 1.0)
      });
    }
    
    // Сортируем по значимости (величине эффекта) и берем top 3
    return effects
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((effect, index) => (
        <Effect key={index} isPositive={effect.isPositive}>
          {effect.text}
        </Effect>
      ));
  };
  
  // Вспомогательная функция для получения названия стихии
  const getElementName = (element) => {
    const elements = {
      fire: 'огня',
      water: 'воды',
      earth: 'земли',
      metal: 'металла',
      wood: 'дерева',
      light: 'света',
      dark: 'тьмы',
      lightning: 'молнии',
      ice: 'льда'
    };
    return elements[element] || element;
  };
  
  return (
    <WeatherContainer>
      <TimeContainer>
        <Time>{weather.formattedTime}</Time>
        <TimeOfDay>{weather.timeOfDay}</TimeOfDay>
      </TimeContainer>
      
      <WeatherIcon icon={getWeatherIcon()} />
      
      <WeatherInfo>
        <WeatherType>
          {weather.weatherType} 
          <IntensityIndicator intensity={weather.weatherIntensity} /> 
          {getIntensityDescription(weather.weatherIntensity)}
        </WeatherType>
        
        <EffectsList>
          {renderWeatherEffects()}
        </EffectsList>
      </WeatherInfo>
    </WeatherContainer>
  );
};

export default WeatherDisplay;
