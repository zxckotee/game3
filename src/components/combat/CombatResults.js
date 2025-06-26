import React from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ResultsPanel = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  text-align: center;
`;

const Title = styled.h2`
  color: ${props => props.victory ? '#4caf50' : '#f44336'};
  margin: 0 0 20px 0;
  font-size: 2rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
`;

const StatBlock = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
`;

const StatTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
`;

const StatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatItem = styled.div`
  color: #aaa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span:last-child {
    color: ${props => props.positive ? '#4caf50' : props.negative ? '#f44336' : '#d4af37'};
  }
`;

const RewardsContainer = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
`;

const RewardsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const RewardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #aaa;
  
  span:first-child {
    font-size: 1.5rem;
  }
  
  span:last-child {
    color: #d4af37;
  }
`;

const Button = styled.button`
  background: #d4af37;
  color: #000;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e5c158;
    transform: translateY(-2px);
  }
`;

function CombatResults({ results, onClose }) {
  const { state } = useGame();
  
  const {
    victory,
    playerStats,
    enemyStats,
    rewards,
    duration
  } = results;
  
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Container>
      <ResultsPanel>
        <Title victory={victory}>
          {victory ? 'Победа!' : 'Поражение'}
        </Title>
        
        <StatsContainer>
          <StatBlock>
            <StatTitle>Ваши показатели</StatTitle>
            <StatList>
              <StatItem>
                <span>Нанесено урона:</span>
                <span>{playerStats.damageDealt}</span>
              </StatItem>
              <StatItem>
                <span>Использовано техник:</span>
                <span>{playerStats.techniquesUsed}</span>
              </StatItem>
              <StatItem>
                <span>Критические удары:</span>
                <span>{playerStats.criticalHits}</span>
              </StatItem>
              <StatItem>
                <span>Уклонения:</span>
                <span>{playerStats.dodges}</span>
              </StatItem>
            </StatList>
          </StatBlock>
          
          <StatBlock>
            <StatTitle>Противник</StatTitle>
            <StatList>
              <StatItem>
                <span>Нанесено урона:</span>
                <span>{enemyStats.damageDealt}</span>
              </StatItem>
              <StatItem>
                <span>Использовано техник:</span>
                <span>{enemyStats.techniquesUsed}</span>
              </StatItem>
              <StatItem>
                <span>Критические удары:</span>
                <span>{enemyStats.criticalHits}</span>
              </StatItem>
              <StatItem>
                <span>Уклонения:</span>
                <span>{enemyStats.dodges}</span>
              </StatItem>
            </StatList>
          </StatBlock>
        </StatsContainer>
        
        {victory && rewards && (
          <RewardsContainer>
            <StatTitle>Награды</StatTitle>
            <RewardsList>
              <RewardItem>
                <span>✨</span>
                <div>
                  <div>Опыт</div>
                  <span>+{rewards.experience}</span>
                </div>
              </RewardItem>
              {rewards.currency && typeof rewards.currency === 'object' ? (
                // Если currency - это объект с разными типами валют
                Object.entries(rewards.currency).map(([currencyType, amount]) => {
                  if (amount <= 0) return null;
                  
                  // Определяем иконку и название валюты
                  let icon = '💰';
                  let name = currencyType;
                  
                  if (currencyType === 'gold') {
                    icon = '🪙';
                    name = 'Золото';
                  } else if (currencyType === 'silver') {
                    icon = '💿';
                    name = 'Серебро';
                  } else if (currencyType === 'copper') {
                    icon = '🔶';
                    name = 'Медь';
                  }
                  
                  return (
                    <RewardItem key={`currency-${currencyType}`}>
                      <span>{icon}</span>
                      <div>
                        <div>{name}</div>
                        <span>+{amount}</span>
                      </div>
                    </RewardItem>
                  );
                })
              ) : (
                // Обратная совместимость - если currency просто число
                <RewardItem>
                  <span>🪙</span>
                  <div>
                    <div>Золото</div>
                    <span>+{rewards.currency}</span>
                  </div>
                </RewardItem>
              )}
              {rewards.items.map((item, index) => (
                <RewardItem key={index}>
                  <span>{item.icon}</span>
                  <div>
                    <div>{item.name}</div>
                    <span>x{item.quantity}</span>
                  </div>
                </RewardItem>
              ))}
            </RewardsList>
          </RewardsContainer>
        )}
        
        <StatItem>
          <span>Длительность боя:</span>
          <span>{formatDuration(duration)}</span>
        </StatItem>
        
        <Button onClick={onClose}>
          Продолжить
        </Button>
      </ResultsPanel>
    </Container>
  );
}

export default CombatResults;
