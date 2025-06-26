import React from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import useTimeWeather from '../../hooks/useTimeWeather';

// Стили для детальной информации о погоде
const DetailContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.9);
  border: 1px solid #555;
  border-radius: 8px;
  padding: 20px;
  color: #fff;
  font-family: 'Arial', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
`;

const DetailTitle = styled.h2`
  font-size: 1.4rem;
  color: #ffd700;
  margin: 0 0 20px 0;
  text-align: center;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 10px;
`;

const Section = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: #ddd;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
`;

// Горизонтальный Grid для прогноза погоды
const ForecastGrid = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  gap: 15px;
  padding-bottom: 10px;
  
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

const InfoBox = styled.div`
  background-color: rgba(50, 50, 50, 0.6);
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 5px 0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  color: #aaa;
`;

const Value = styled.span`
  color: #fff;
  font-weight: bold;
  
  ${props => props.highlight && `
    color: #ffd700;
  `}
  
  ${props => props.type === 'positive' && `
    color: #7FFF7F;
  `}
  
  ${props => props.type === 'negative' && `
    color: #FF7F7F;
  `}
`;

const ForecastItem = styled.div`
  background-color: rgba(50, 50, 50, 0.6);
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  min-width: 250px;
  max-width: 300px;
  flex: 1;
  
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

const ForecastHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
`;

const ForecastIcon = styled.span`
  font-size: 1.4rem;
  margin-right: 5px;
`;

const ForecastTime = styled.div`
  font-size: 0.9rem;
  color: #aaa;
`;

const ProgressBar = styled.div`
  background-color: rgba(30, 30, 30, 0.6);
  height: 8px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress || 0}%;
    background: ${props => {
      switch (props.type) {
        case 'time': return 'linear-gradient(to right, #4682B4, #87CEEB)';
        case 'day': return 'linear-gradient(to right, #FFD700, #FFA500)';
        case 'season': return 'linear-gradient(to right, #9370DB, #8A2BE2)';
        default: return 'linear-gradient(to right, #4682B4, #87CEEB)';
      }
    }};
    border-radius: 4px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
  
  &:hover {
    color: #fff;
  }
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

// Русские названия событий
const eventNames = {
  bloom: 'Цветение духовных трав',
  spirit_tide: 'Прилив духовной энергии',
  solstice: 'Солнцестояние',
  meteor_shower: 'Метеоритный дождь',
  harvest: 'Сбор урожая',
  spirit_wind: 'Духовный ветер',
  ice_tribulation: 'Ледяная трибуляция',
  blizzard: 'Метель'
};

// Иконки для событий
const eventIcons = {
  bloom: '🌸',
  spirit_tide: '🌊',
  solstice: '☀️',
  meteor_shower: '☄️',
  harvest: '🌾',
  spirit_wind: '🌬️',
  ice_tribulation: '❄️',
  blizzard: '🌨️'
};

// Русские названия времени суток
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

/**
 * Компонент детальной информации о погоде и времени
 */
function WeatherDetailScreen({ onClose }) {
  const { state } = useGame();
  const timeWeather = useTimeWeather(); // Используем хук для получения единых данных о времени
  
  // Проверяем, что хук вернул данные
  if (!timeWeather) return null;
  
  // Получаем данные о погоде и времени
  const weather = state.weather || {};
  const worldState = state.world || {};
  const currentLocation = worldState.currentLocation || {};
  
  // Используем данные о времени из хука useTimeWeather
  const hour = timeWeather.hour;
  const minute = timeWeather.minute;
  const daytimePeriod = timeWeather.daytimePeriod;
  
  // Форматируем время
  const formattedTime = timeWeather.formattedTime;
  
  // Получаем текущую погоду и интенсивность из timeWeather
  // Используем хук useTimeWeather как источник правды о текущей погоде
  const currentWeather = timeWeather.currentWeather;
  const weatherIntensity = timeWeather.weatherIntensity;
  
  // Получаем прогресс времени до следующей смены погоды
  const nextWeatherChange = weather.nextWeatherChange || 0;
  const weatherDuration = 120; // Примерное базовое время погоды
  const weatherProgress = Math.max(0, Math.min(100, 100 - (nextWeatherChange / weatherDuration * 100)));
  
  // Получаем actions для диспатча
  const { actions } = useGame();

  // Для отладки - проверяем, соответствует ли погода в state.weather тому, что возвращает useTimeWeather
  // Если нет, выводим предупреждение в консоль
  React.useEffect(() => {
    if (weather.currentWeather && weather.currentWeather !== currentWeather) {
      console.warn('⚠️ Несоответствие погоды:', {
        hookWeather: currentWeather,
        stateWeather: weather.currentWeather
      });
    }
  }, [currentWeather, weather.currentWeather]);
  
  // Проверка нулевого таймера и принудительная смена погоды
  React.useEffect(() => {
    if (nextWeatherChange === 0 && currentWeather) {
      console.log('⚠️ WeatherDetailScreen: Обнаружен нулевой nextWeatherChange, инициируем смену погоды');
      
      // Принудительно меняем погоду с небольшой задержкой
      const timer = setTimeout(() => {
        actions.dispatch({ type: 'FORCE_WEATHER_CHANGE' });
        console.log('🌦️ WeatherDetailScreen: Выполнена принудительная смена погоды из-за нулевого таймера');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [nextWeatherChange, currentWeather, actions]);
  
  // Получаем сезон и день сезона
  const currentSeason = timeWeather.season;
  const seasonDay = weather.seasonDay || 1;
  const seasonLength = weather.seasonLength || 30;
  const seasonProgress = (seasonDay / seasonLength) * 100;
  
  // Получаем активное особое событие
  const activeEvent = weather.activeEvent || null;
  const eventRemainingTime = weather.eventRemainingTime || 0;
  
  // Получаем прогноз погоды
  const forecast = weather.forecast || [];
  
  // Прогресс дня (от 0 до 100%)
  const dayProgress = ((hour * 60 + minute) / (24 * 60)) * 100;
  
  return (
    <DetailContainer>
      <CloseButton onClick={onClose}>×</CloseButton>
      <DetailTitle>Детальная информация о погоде и времени</DetailTitle>
      
      <Section>
        <SectionTitle>
          <span>🕒 Текущее время и погода</span>
        </SectionTitle>
        <Grid>
          <InfoBox>
            <InfoRow>
              <Label>Время:</Label>
              <Value highlight>{formattedTime}</Value>
            </InfoRow>
            <InfoRow>
              <Label>Период суток:</Label>
              <Value>
                {daytimeIcons[daytimePeriod]} {daytimeNames[daytimePeriod]}
              </Value>
            </InfoRow>
            <InfoRow>
              <Label>Суточный цикл:</Label>
              <Value>
                <ProgressBar progress={dayProgress} type="day" />
              </Value>
            </InfoRow>
            <InfoRow>
              <Label>День:</Label>
              <Value>{timeWeather.dayCount}</Value>
            </InfoRow>
          </InfoBox>
          
          <InfoBox>
            <InfoRow>
              <Label>Текущая погода:</Label>
              <Value>
                {weatherIcons[currentWeather]} {weatherNames[currentWeather]}
              </Value>
            </InfoRow>
            <InfoRow>
              <Label>Интенсивность:</Label>
              <Value>{Math.min(100, Math.round(weatherIntensity * 100))}%</Value>
            </InfoRow>
            <InfoRow>
              <Label>До смены погоды:</Label>
              <Value>{nextWeatherChange} мин. игрового времени</Value>
            </InfoRow>
            <InfoRow>
              <Label>Прогресс:</Label>
              <Value>
                <ProgressBar progress={weatherProgress} type="time" />
              </Value>
            </InfoRow>
          </InfoBox>
        </Grid>
      </Section>
      
      <Section>
        <SectionTitle>
          <span>🌡️ Сезон и события</span>
        </SectionTitle>
        <Grid>
          <InfoBox>
            <InfoRow>
              <Label>Текущий сезон:</Label>
              <Value>
                {seasonIcons[currentSeason]} {seasonNames[currentSeason]}
              </Value>
            </InfoRow>
            <InfoRow>
              <Label>День сезона:</Label>
              <Value>{seasonDay} из {seasonLength}</Value>
            </InfoRow>
            <InfoRow>
              <Label>Прогресс сезона:</Label>
              <Value>
                <ProgressBar progress={seasonProgress} type="season" />
              </Value>
            </InfoRow>
          </InfoBox>
          
          <InfoBox>
            <InfoRow>
              <Label>Активное событие:</Label>
              <Value highlight={activeEvent !== null}>
                {activeEvent ? `${eventIcons[activeEvent]} ${eventNames[activeEvent]}` : 'Нет активных событий'}
              </Value>
            </InfoRow>
            {activeEvent && (
              <>
                <InfoRow>
                  <Label>Оставшееся время:</Label>
                  <Value>{eventRemainingTime} мин. игрового времени</Value>
                </InfoRow>
                <InfoRow>
                  <Label>Прогресс события:</Label>
                  <Value>
                    <ProgressBar 
                      progress={100 - (eventRemainingTime / (weather.specialEvents?.[activeEvent]?.duration || 120) * 100)} 
                      type="time" 
                    />
                  </Value>
                </InfoRow>
              </>
            )}
          </InfoBox>
        </Grid>
      </Section>
      
      {forecast.length > 0 && (
        <Section>
          <SectionTitle>
            <span>🔮 Прогноз погоды</span>
          </SectionTitle>
          <ForecastGrid>
            {/* Первый элемент показывает текущую погоду для сравнения */}
            <ForecastItem weatherType={currentWeather}>
              <ForecastHeader>
                <div>
                  <ForecastIcon>{weatherIcons[currentWeather]}</ForecastIcon>
                  {weatherNames[currentWeather]}
                </div>
                <Value type={weatherIntensity > 1 ? 'negative' : 'positive'}>
                  {Math.round(weatherIntensity * 100)}%
                </Value>
              </ForecastHeader>
              <ForecastTime>
                <strong>Текущая погода</strong>
              </ForecastTime>
              <ForecastTime>
                До смены: {nextWeatherChange} мин. игрового времени
              </ForecastTime>
            </ForecastItem>
            
            {/* Остальные элементы прогноза */}
            {forecast.map((item, index) => (
              <ForecastItem key={index} weatherType={item.type}>
                <ForecastHeader>
                  <div>
                    <ForecastIcon>{weatherIcons[item.type]}</ForecastIcon>
                    {weatherNames[item.type]}
                  </div>
                  <Value type={item.intensity > 1 ? 'negative' : 'positive'}>
                    {Math.round(item.intensity * 100)}%
                  </Value>
                </ForecastHeader>
                <ForecastTime>
                  Через {item.timeToOccur} мин. игрового времени
                </ForecastTime>
                <ForecastTime>
                  Продолжительность: {item.duration} мин. игрового времени
                </ForecastTime>
              </ForecastItem>
            ))}
          </ForecastGrid>
        </Section>
      )}
      
      <Section>
        <SectionTitle>
          <span>🏞️ Влияние локации</span>
        </SectionTitle>
        <InfoBox>
          <InfoRow>
            <Label>Текущая локация:</Label>
            <Value highlight>
              {currentLocation && currentLocation.name ? 
                currentLocation.name : 
                'Долина Начала' /* Исправляем "Неизвестно" на "Долина Начала" */}
            </Value>
          </InfoRow>
          
          {/* Динамически генерируем эффекты локации, как в MapTab.js */}
          {(() => {
            // Базовые бонусы локации
            const locationEffects = {};
            
            // Устанавливаем тип 'forest' для Долины начала (если currentLocation равно null)
            const locationType = currentLocation && currentLocation.type ? currentLocation.type : 'forest';
            
            // Используем определенный тип локации или 'forest' для Долины начала
            {
              // Используем locationType вместо проверки на наличие currentLocation
              // Расчет особых эффектов для локации в зависимости от погоды и сезона
              switch(locationType) {
                case 'forest':
                  locationEffects.baseEnergy = { value: '+5%', positive: true };
                  locationEffects.basePerception = { value: '+10%', positive: true };
                  
                  if (currentSeason === 'spring') 
                    locationEffects.resourceBonus = { value: '+20% к сбору ресурсов', positive: true };
                  if (currentWeather === 'rain') 
                    locationEffects.energyRecovery = { value: '+10% к восстановлению энергии', positive: true };
                  break;
                case 'mountain':
                  locationEffects.baseStrength = { value: '+5%', positive: true };
                  locationEffects.baseStamina = { value: '+15%', positive: true };
                  
                  if (currentSeason === 'winter') 
                    locationEffects.cultivationSpeed = { value: '+15% к скорости культивации', positive: true };
                  if (currentWeather === 'thunderstorm') 
                    locationEffects.insightChance = { value: '+20% к шансу озарения', positive: true };
                  break;
                case 'water':
                  locationEffects.baseWisdom = { value: '+10%', positive: true };
                  locationEffects.baseHealing = { value: '+15%', positive: true };
                  
                  if (currentSeason === 'summer') 
                    locationEffects.cooldown = { value: '-20% к времени восстановления навыков', positive: true };
                  if (currentWeather === 'clear') 
                    locationEffects.spiritualEnergy = { value: '+20% к получению духовной энергии', positive: true };
                  break;
                case 'city':
                  locationEffects.baseSocial = { value: '+20%', positive: true };
                  locationEffects.baseLuck = { value: '+5%', positive: true };
                  
                  if (currentSeason === 'autumn') 
                    locationEffects.tradeBonus = { value: '+15% к выгоде при торговле', positive: true };
                  if (currentWeather === 'fog') 
                    locationEffects.stealthBonus = { value: '+30% к скрытности', positive: true };
                  break;
                case 'dungeon':
                  locationEffects.baseAttack = { value: '+10%', positive: true };
                  locationEffects.baseDefense = { value: '+5%', positive: true };
                  
                  if (currentSeason === 'winter') 
                    locationEffects.defenseBonus = { value: '+10% к защите', positive: true };
                  if (currentWeather === 'thunderstorm') 
                    locationEffects.attackBonus = { value: '+20% к атаке', positive: true };
                  break;
              }
              
              // Эффекты времени суток для разных локаций
              switch(daytimePeriod) {
                case 'dawn':
                  if (locationType === 'forest')
                    locationEffects.dawnPerception = { value: '+15% к восприятию', positive: true };
                  if (locationType === 'water')
                    locationEffects.dawnMeditation = { value: '+25% к эффекту медитации', positive: true };
                  break;
                case 'afternoon':
                  if (locationType === 'mountain')
                    locationEffects.dayStamina = { value: '+10% к выносливости', positive: true };
                  break;
                case 'night':
                case 'deepNight':
                  if (locationType === 'water')
                    locationEffects.nightEnergy = { value: '+20% к духовной энергии', positive: true };
                  if (locationType === 'dungeon')
                    locationEffects.nightMonsterStrength = { value: '+15% к силе монстров', positive: false };
                  break;
              }
              
              // Особые эффекты при активных событиях
              if (activeEvent) {
                switch(activeEvent) {
                  case 'bloom':
                    if (locationType === 'forest')
                      locationEffects.bloomHerbQuality = { value: '+50% к качеству трав', positive: true };
                    break;
                  case 'spirit_tide':
                    if (locationType === 'water')
                      locationEffects.tideSpiritualPower = { value: '+40% к силе духовных техник', positive: true };
                    break;
                  case 'solstice':
                    if (locationType === 'mountain')
                      locationEffects.solsticeCultivation = { value: '+30% к скорости культивации', positive: true };
                    break;
                  case 'meteor_shower':
                    locationEffects.meteorRareMaterials = { value: 'Шанс найти редкие материалы', positive: true };
                    break;
                }
              }
            }
            
            return (
              <>
                <InfoRow>
                  <Label>Особенности локации:</Label>
                  <Value>
                    {Object.entries(locationEffects).filter(([key]) => key.startsWith('base')).length > 0 
                      ? Object.entries(locationEffects)
                          .filter(([key]) => key.startsWith('base'))
                          .map(([key, effect]) => key.replace('base', '') + ': ' + effect.value)
                          .join(', ')
                      : 'Отсутствуют'
                    }
                  </Value>
                </InfoRow>
                <InfoRow>
                  <Label>Погодные модификаторы:</Label>
                  <Value>
                    {Object.entries(locationEffects).filter(([key]) => !key.startsWith('base')).length > 0 
                      ? Object.entries(locationEffects)
                          .filter(([key]) => !key.startsWith('base'))
                          .map(([key, effect]) => effect.value)
                          .join(', ')
                      : 'Отсутствуют'
                    }
                  </Value>
                </InfoRow>
              </>
            );
          })()}
        </InfoBox>
      </Section>
    </DetailContainer>
  );
}

export default WeatherDetailScreen;
