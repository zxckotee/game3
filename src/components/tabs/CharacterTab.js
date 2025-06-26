import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';

const Container = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
`;

const CharacterPanel = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const Avatar = styled.div`
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  background: #2c2c2c;
  border: 2px solid #d4af37;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #d4af37;
`;

const CharacterInfo = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const CharacterName = styled.h2`
  color: #d4af37;
  margin: 0 0 5px;
`;

const CharacterTitle = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const CultivationRealm = styled.div`
  color: #f0f0f0;
  font-size: 1.1rem;
  margin-bottom: 20px;
`;

const StatsPanel = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const StatGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatGroupTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px;
  font-size: 1.1rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  padding-bottom: 5px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
`;

const StatControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  border: 1px solid #d4af37;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.4);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const UnassignedPoints = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 4px;
  text-align: center;
  color: #d4af37;
  font-weight: bold;
`;

const StatLabel = styled.span`
  color: #aaa;
`;

const StatValue = styled.span`
  color: #f0f0f0;
`;

const BackgroundInfo = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
`;

const BackgroundTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px;
  font-size: 1.1rem;
`;

const BackgroundText = styled.p`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
`;

function CharacterTab() {
  const { state, actions } = useGame();
  const player = state?.player || {};
  const cultivation = player?.cultivation || {};
  const stats = player?.stats || {};
  const derivedStats = player?.secondaryStats || {};
  const unassignedPoints = stats.unassignedPoints || 0;
  
  // Эффект для загрузки статистики персонажа при монтировании компонента
  useEffect(() => {
    if (player && player.id) {
      console.log('CharacterTab: Загружаем статистику персонажа из API');
      
      // Делаем запрос к API для получения статистики
      fetch(`/api/users/${player.id}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка при получении статистики персонажа');
        }
        return response.json();
      })
      .then(data => {
        console.log('CharacterTab: Получены данные статистики:', data);
        
        // Обновляем статистику в состоянии Redux
        if (data) {
          actions.updatePlayerStats(data);
        }
      })
      .catch(error => {
        console.error('Ошибка при загрузке статистики персонажа:', error);
      });
    }
  }, [player.id]); // Зависимость от ID игрока
  
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
  
  // Функция для форматирования значения характеристики
  const formatStat = (value) => {
    value = value || 0;
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };
  
  // Функция для увеличения характеристики
  const increaseStat = (statName) => {
    if (unassignedPoints <= 0) return;
    
    const newStats = {
      ...stats,
      [statName]: (stats[statName] || 0) + 1,
      unassignedPoints: unassignedPoints - 1
    };
    
    actions.updatePlayerStats(newStats);
  };
  
  // Добавляем отладочный вывод для проверки структуры данных
  console.log('DEBUG - CharacterTab - Состояние игрока:', state.player);
  console.log('DEBUG - CharacterTab - Бонусы экипировки:', player.equipmentBonuses);
  console.log('DEBUG - CharacterTab - Характеристики:', stats);
  console.log('DEBUG - CharacterTab - Вторичные характеристики:', derivedStats);
  
  return (
    <Container>
      <CharacterPanel>
        <Avatar>
          {(player.name || '?')[0].toUpperCase()}
        </Avatar>
        
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
        <StatGroup>
          <StatGroupTitle>Основные характеристики</StatGroupTitle>
          {unassignedPoints > 0 && (
            <UnassignedPoints>
              Нераспределенные очки: {unassignedPoints}
            </UnassignedPoints>
          )}
          <StatGrid>
            <StatItem>
              <StatLabel>Сила</StatLabel>
              <StatControls>
                <StatValue>
                  {formatStat(stats.strength)}
                  {/* Для силы сохраняем тот же ключ */}
                  {player.equipmentBonuses?.stats?.strength > 0 && (
                    <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                      +{player.equipmentBonuses.stats.strength}
                    </span>
                  )}
                </StatValue>
                {unassignedPoints > 0 && (
                  <StatButton onClick={() => increaseStat('strength')}>+</StatButton>
                )}
              </StatControls>
            </StatItem>
            <StatItem>
              <StatLabel>Ловкость</StatLabel>
              <StatControls>
                <StatValue>
                  {formatStat(stats.agility)}
                  {/* Для agility отображаем dexterity из бонусов */}
                  {player.equipmentBonuses?.stats?.dexterity > 0 && (
                    <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                      +{player.equipmentBonuses.stats.dexterity}
                    </span>
                  )}
                </StatValue>
                {unassignedPoints > 0 && (
                  <StatButton onClick={() => increaseStat('agility')}>+</StatButton>
                )}
              </StatControls>
            </StatItem>
            <StatItem>
              <StatLabel>Здоровье</StatLabel>
              <StatControls>
                <StatValue>
                  {formatStat(stats.health)}
                  {/* Для health отображаем vitality из бонусов */}
                  {player.equipmentBonuses?.stats?.vitality > 0 && (
                    <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                      +{player.equipmentBonuses.stats.vitality}
                    </span>
                  )}
                </StatValue>
                {unassignedPoints > 0 && (
                  <StatButton onClick={() => increaseStat('health')}>+</StatButton>
                )}
              </StatControls>
            </StatItem>
            <StatItem>
              <StatLabel>Интеллект</StatLabel>
              <StatControls>
                <StatValue>
                  {formatStat(stats.intellect)}
                  {/* Для intellect отображаем intelligence из бонусов */}
                  {player.equipmentBonuses?.stats?.intelligence > 0 && (
                    <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                      +{player.equipmentBonuses.stats.intelligence}
                    </span>
                  )}
                </StatValue>
                {unassignedPoints > 0 && (
                  <StatButton onClick={() => increaseStat('intellect')}>+</StatButton>
                )}
              </StatControls>
            </StatItem>
            <StatItem>
              <StatLabel>Дух</StatLabel>
              <StatControls>
                <StatValue>
                  {formatStat(stats.spirit)}
                  {/* Для spirit отображаем perception из бонусов */}
                  {player.equipmentBonuses?.stats?.perception > 0 && (
                    <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                      +{player.equipmentBonuses.stats.perception}
                    </span>
                  )}
                </StatValue>
                {unassignedPoints > 0 && (
                  <StatButton onClick={() => increaseStat('spirit')}>+</StatButton>
                )}
              </StatControls>
            </StatItem>
            {/* Добавляем отображение для удачи, если нужно */}
            {player.equipmentBonuses?.stats?.luck > 0 && (
              <StatItem>
                <StatLabel>Удача</StatLabel>
                <StatControls>
                  <StatValue>
                    {0}
                    <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                      +{player.equipmentBonuses.stats.luck}
                    </span>
                  </StatValue>
                </StatControls>
              </StatItem>
            )}
          </StatGrid>
        </StatGroup>
        
        <StatGroup>
          <StatGroupTitle>Боевые характеристики</StatGroupTitle>
          <StatGrid>
            <StatItem>
              <StatLabel>Физ. атака</StatLabel>
              <StatValue>
                {formatStat(stats.strength)}
                {player.equipmentBonuses?.combat?.physicalDamage > 0 && (
                  <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                    +{player.equipmentBonuses.combat.physicalDamage}
                  </span>
                )}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Маг. атака</StatLabel>
              <StatValue>
                {formatStat(derivedStats.magicalAttack)}
                {player.equipmentBonuses?.combat?.magicDamage > 0 && (
                  <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                    +{player.equipmentBonuses.combat.magicDamage}
                  </span>
                )}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Физ. защита</StatLabel>
              <StatValue>
                {formatStat(derivedStats.physicalDefense)}
                {player.equipmentBonuses?.combat?.physicalDefense > 0 && (
                  <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                    +{player.equipmentBonuses.combat.physicalDefense}
                  </span>
                )}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Маг. защита</StatLabel>
              <StatValue>
                {formatStat(derivedStats.magicalDefense)}
                {player.equipmentBonuses?.combat?.magicDefense > 0 && (
                  <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                    +{player.equipmentBonuses.combat.magicDefense}
                  </span>
                )}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Уклонение</StatLabel>
              <StatValue>
                {formatStat(derivedStats.evasion)}
                {player.equipmentBonuses?.combat?.dodgeChance > 0 && (
                  <span style={{ color: '#4caf50', marginLeft: '5px' }}>
                    +{player.equipmentBonuses.combat.dodgeChance}%
                  </span>
                )}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Точность</StatLabel>
              <StatValue>{formatStat(derivedStats.accuracy)}</StatValue>
            </StatItem>
          </StatGrid>
        </StatGroup>
        
        <StatGroup>
          <StatGroupTitle>Культивация</StatGroupTitle>
          <StatGrid>
            <StatItem>
              <StatLabel>Духовная энергия</StatLabel>
              <StatValue>{cultivation.energy || 0}/{cultivation.maxEnergy || 100}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Опыт</StatLabel>
              <StatValue>{cultivation.experience || 0}/{cultivation.experienceRequired || 100}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Понимание Дао</StatLabel>
              <StatValue>{cultivation.daoUnderstanding || 0}%</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Прорывы</StatLabel>
              <StatValue>{cultivation.breakthroughs || 0}</StatValue>
            </StatItem>
          </StatGrid>
        </StatGroup>
      </StatsPanel>
    </Container>
  );
}

export default CharacterTab;
