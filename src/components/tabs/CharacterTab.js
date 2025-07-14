import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const CharacterPanel = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 16px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
`;

const Avatar = styled.div`
  width: 200px;
  height: 200px;
  margin: 0 auto 24px;
  background: linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%);
  border: 3px solid transparent;
  background-clip: padding-box;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  font-weight: bold;
  color: #d4af37;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 50%;
    padding: 3px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
  }
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(212, 175, 55, 0.4);
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const AvatarUploadContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const AvatarUploadButton = styled.button`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: #1a1a1a;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const AvatarFileInput = styled.input`
  display: none;
`;

const AvatarUploadStatus = styled.div`
  font-size: 0.8rem;
  color: ${props => props.error ? '#ff6b6b' : '#4ecdc4'};
  text-align: center;
  min-height: 20px;
`;

const CharacterInfo = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const CharacterName = styled.h2`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
  font-size: 1.8rem;
  font-weight: bold;
`;

const CharacterTitle = styled.div`
  color: #aaa;
  font-size: 1rem;
  margin-bottom: 12px;
  font-style: italic;
`;

const CultivationRealm = styled.div`
  background: linear-gradient(45deg, #f0f0f0, #d4af37);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 24px;
`;

const StatsPanel = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 16px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
  }
`;

const StatGroup = styled.div`
  margin-bottom: 32px;
  animation: ${fadeIn} 0.6s ease-out;
  animation-delay: ${props => props.delay || '0s'};
  animation-fill-mode: both;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatGroupTitle = styled.h3`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px;
  font-size: 1.3rem;
  font-weight: bold;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  padding-bottom: 8px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
`;

const StatCard = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  padding: 16px;
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
    transform: translateY(-2px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.15);
    animation: ${pulse} 2s infinite;
    
    &::before {
      left: 100%;
    }
  }
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatLabel = styled.span`
  color: #bbb;
  font-size: 0.95rem;
  font-weight: 500;
`;

const StatValue = styled.span`
  color: #f0f0f0;
  font-size: 1.1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatBonus = styled.span`
  color: #4caf50;
  font-size: 0.9rem;
  font-weight: bold;
`;

const BackgroundInfo = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid rgba(212, 175, 55, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
  }
`;

const BackgroundTitle = styled.h3`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: bold;
`;

const BackgroundText = styled.p`
  color: #f0f0f0;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  text-align: justify;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 50%;
  border-top-color: #d4af37;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function CharacterTab() {
  const { state, actions } = useGame();
  const player = state?.player || {};
  const cultivation = player?.cultivation || {};
  const characterStats = player?.characterStats || { base: null, modified: null, secondary: null };
  
  // Состояние для загрузки аватарки
  const fileInputRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Загрузка статистики персонажа при монтировании компонента
  useEffect(() => {
    if (player && player.id) {
      console.log('CharacterTab: Загружаем статистику персонажа из API');
      actions.loadCharacterStats(player.id);
    }
  }, [player.id, actions]);
  
  // Загрузка аватарки персонажа при монтировании компонента
  useEffect(() => {
    if (player && player.id && !player.avatar) {
      console.log('CharacterTab: Загружаем аватарку персонажа');
      actions.loadAvatar(player.id);
    }
  }, [player.id, player.avatar, actions]);
  
  // Обработчики для загрузки аватарки
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const validateFile = (file) => {
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Поддерживаются только файлы JPG, PNG и WebP';
    }
    
    // Проверка размера файла (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Размер файла не должен превышать 2MB';
    }
    
    return null;
  };
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Валидация файла
    const validationError = validateFile(file);
    if (validationError) {
      setUploadStatus(validationError);
      return;
    }
    
    try {
      setUploadStatus('Загрузка...');
      await actions.uploadAvatar(player.id, file);
      setUploadStatus('Аватарка успешно загружена!');
      
      // Очищаем статус через 3 секунды
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      console.error('Ошибка загрузки аватарки:', error);
      setUploadStatus('Ошибка загрузки аватарки');
      setTimeout(() => setUploadStatus(''), 3000);
    }
    
    // Очищаем input
    event.target.value = '';
  };
  
  // Helper функции (аналогичные EquipmentTab)
  const getStatDisplayName = (statKey) => {
    const statNames = {
      // Базовые характеристики
      strength: 'Сила',
      intellect: 'Интеллект',
      spirit: 'Дух',
      agility: 'Ловкость',
      health: 'Здоровье',
      luck: 'Удача',
      
      // Вторичные характеристики
      physicalDefense: 'Физическая защита',
      spiritualDefense: 'Магическая защита',
      spiritualAttack: 'Духовная атака',
      attackSpeed: 'Скорость атаки',
      criticalChance: 'Шанс крит. удара',
      movementSpeed: 'Скорость передвижения'
    };
    return statNames[statKey] || statKey;
  };
  
  const isPercentageStat = (statKey) => {
    return ['criticalChance', 'attackSpeed', 'movementSpeed'].includes(statKey);
  };
  
  const formatStatValue = (value, statKey) => {
    if (value === null || value === undefined) return '0';
    
    if (isPercentageStat(statKey)) {
      return `${value}%`;
    }
    
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    
    return value.toString();
  };
  
  // Функция для получения названия стадии развития
  const getCultivationStageName = (level) => {
    level = level || 0;
    if (level < 10) return 'Ученик';
    if (level < 20) return 'Практик';
    if (level < 30) return 'Адепт';
    if (level < 40) return 'Мастер';
    if (level < 50) return 'Грандмастер';
    return 'Бессмертный';
  };
  
  // Функция для вычисления бонуса экипировки
  const getEquipmentBonus = (statKey) => {
    if (!characterStats.base || !characterStats.modified) return 0;
    return (characterStats.modified[statKey] || 0) - (characterStats.base[statKey] || 0);
  };
  
  // Отладочный вывод
  console.log('DEBUG - CharacterTab - Состояние игрока:', state.player);
  console.log('DEBUG - CharacterTab - Характеристики:', characterStats);
  
  return (
    <Container>
      <CharacterPanel>
        <AvatarUploadContainer>
          <Avatar onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
            {player.avatar ? (
              <AvatarImage
                src={player.avatar}
                alt={player.name || 'Аватарка персонажа'}
                onError={(e) => {
                  console.warn('Ошибка загрузки аватарки:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{
              display: player.avatar ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#d4af37'
            }}>
              {(player.name || '?')[0].toUpperCase()}
            </div>
          </Avatar>
          
          <AvatarFileInput
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
          />
          
          {uploadStatus && (
            <AvatarUploadStatus error={uploadStatus.includes('Ошибка') || uploadStatus.includes('превышать') || uploadStatus.includes('Поддерживаются')}>
              {uploadStatus}
            </AvatarUploadStatus>
          )}
        </AvatarUploadContainer>
        
        <CharacterInfo>
          <CharacterName>{player.name || 'Безымянный'}</CharacterName>
          <CharacterTitle>{player.title || 'Без титула'}</CharacterTitle>
          <CultivationRealm>
            {getCultivationStageName(cultivation.level)} ({cultivation.level || 0} уровень)
          </CultivationRealm>
        </CharacterInfo>
        
        <BackgroundInfo>
          <BackgroundTitle>Предыстория</BackgroundTitle>
          <BackgroundText>
            {player.background || 'История этого культиватора пока не написана...'}
          </BackgroundText>
        </BackgroundInfo>
      </CharacterPanel>
      
      <StatsPanel>
        <StatGroup delay="0.1s">
          <StatGroupTitle>Основные характеристики</StatGroupTitle>
          <StatGrid>
            {characterStats.modified ? (
              ['strength', 'intellect', 'spirit', 'agility', 'health', 'luck'].map(statKey => {
                const baseValue = characterStats.modified[statKey] || 0;
                const bonus = getEquipmentBonus(statKey);
                
                // Показываем только если есть базовое значение или бонус
                if (baseValue === 0 && bonus === 0) return null;
                
                return (
                  <StatCard key={statKey}>
                    <StatItem>
                      <StatLabel>{getStatDisplayName(statKey)}</StatLabel>
                      <StatValue>
                        {formatStatValue(baseValue, statKey)}
                        {bonus > 0 && (
                          <StatBonus>+{formatStatValue(bonus, statKey)}</StatBonus>
                        )}
                      </StatValue>
                    </StatItem>
                  </StatCard>
                );
              })
            ) : (
              <StatCard>
                <StatItem>
                  <StatLabel>Загрузка...</StatLabel>
                  <StatValue><LoadingSpinner /></StatValue>
                </StatItem>
              </StatCard>
            )}
          </StatGrid>
        </StatGroup>
        
        <StatGroup delay="0.2s">
          <StatGroupTitle>Вторичные характеристики</StatGroupTitle>
          <StatGrid>
            {characterStats.secondary ? (
              ['physicalDefense', 'spiritualDefense', 'spiritualAttack', 'attackSpeed', 'criticalChance', 'movementSpeed'].map(statKey => {
                const value = characterStats.secondary[statKey];
                if (value !== undefined) {
                  return (
                    <StatCard key={statKey}>
                      <StatItem>
                        <StatLabel>{getStatDisplayName(statKey)}</StatLabel>
                        <StatValue>{formatStatValue(value, statKey)}</StatValue>
                      </StatItem>
                    </StatCard>
                  );
                }
                return null;
              })
            ) : (
              <StatCard>
                <StatItem>
                  <StatLabel>Загрузка...</StatLabel>
                  <StatValue><LoadingSpinner /></StatValue>
                </StatItem>
              </StatCard>
            )}
          </StatGrid>
        </StatGroup>
        
        <StatGroup delay="0.3s">
          <StatGroupTitle>Культивация</StatGroupTitle>
          <StatGrid>
            <StatCard>
              <StatItem>
                <StatLabel>Духовная энергия</StatLabel>
                <StatValue>{cultivation.energy || 0}/{cultivation.maxEnergy || 100}</StatValue>
              </StatItem>
            </StatCard>
            <StatCard>
              <StatItem>
                <StatLabel>Опыт</StatLabel>
                <StatValue>{cultivation.experience || 0}/{cultivation.experienceRequired || 100}</StatValue>
              </StatItem>
            </StatCard>
            <StatCard>
              <StatItem>
                <StatLabel>Понимание Дао</StatLabel>
                <StatValue>{cultivation.daoUnderstanding || 0}%</StatValue>
              </StatItem>
            </StatCard>
            <StatCard>
              <StatItem>
                <StatLabel>Прорывы</StatLabel>
                <StatValue>{cultivation.breakthroughs || 0}</StatValue>
              </StatItem>
            </StatCard>
          </StatGrid>
        </StatGroup>
      </StatsPanel>
    </Container>
  );
}

export default CharacterTab;
