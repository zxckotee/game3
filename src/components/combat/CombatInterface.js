import React, { useContext } from 'react';
import styled from 'styled-components';
import Portrait from './Portrait';
import ActionBar from './ActionBar';
import StatusEffects from './StatusEffects';
import CombatLog from './CombatLog';
import { GameContext } from '../../context/GameContext';

// Проверяем и логируем импорты для отладки
console.log('CombatInterface импорты:', {
  Portrait: typeof Portrait,
  ActionBar: typeof ActionBar,
  StatusEffects: typeof StatusEffects,
  CombatLog: typeof CombatLog
});

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  height: 100%;
  background: linear-gradient(to bottom, #1a1a2e 0%, #16213e 100%);
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  font-family: 'Arial', sans-serif;
`;

const CombatArea = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 20px;
  position: relative;
`;

const CharacterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 300px;
  position: relative;
  z-index: 1;
  
  &.player {
    box-shadow: 0 0 15px rgba(100, 149, 237, 0.3);
  }
  
  &.enemy {
    box-shadow: 0 0 15px rgba(220, 20, 60, 0.3);
  }
`;

const EffectsContainer = styled.div`
  background: rgba(13, 17, 23, 0.7);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
`;

const EffectsTitle = styled.div`
  color: #e0e0e0;
  font-size: 0.9rem;
  margin-bottom: 10px;
  font-weight: bold;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
`;

const CenterArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      to right,
      transparent 0%,
      rgba(218, 165, 32, 0.5) 50%,
      transparent 100%
    );
    z-index: 0;
  }
`;

const TurnIndicator = styled.div`
  color: #ffd700;
  font-size: 1.3rem;
  text-align: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  min-width: 220px;
  box-shadow: 0 0 20px rgba(218, 165, 32, 0.4);
  border: 1px solid rgba(218, 165, 32, 0.3);
  font-weight: bold;
  text-shadow: 0 0 5px rgba(218, 165, 32, 0.5);
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { box-shadow: 0 0 20px rgba(218, 165, 32, 0.4); }
    50% { box-shadow: 0 0 30px rgba(218, 165, 32, 0.6); }
    100% { box-shadow: 0 0 20px rgba(218, 165, 32, 0.4); }
  }
`;

const ActionArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogArea = styled.div`
  flex: 1;
  min-height: 180px;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.2);
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

function CombatInterface({
  player,
  enemy,
  playerActions,
  onActionSelect,
  isPlayerTurn,
  disabled,
  combatLog = []
}) {
  // Используется только для доступа к состоянию игры, если это потребуется
  const { state } = useContext(GameContext);
  
  return (
    <Container>
      <CombatArea>
        <CharacterContainer className="player">
          <Portrait
            name={player.name}
            level={player.level}
            icon={player.icon || '👤'}
            health={player.stats.health}
            maxHealth={player.stats.maxHealth}
            energy={player.stats.energy}
            maxEnergy={player.stats.maxEnergy}
          />
          
          <EffectsContainer>
            <EffectsTitle>Активные эффекты</EffectsTitle>
            <StatusEffects effects={player.effects} />
          </EffectsContainer>
        </CharacterContainer>
        
        <CenterArea>
          <TurnIndicator>
            {isPlayerTurn ? 'Ваш ход' : 'Ход противника'}
          </TurnIndicator>
        </CenterArea>
        
        <CharacterContainer className="enemy">
          <Portrait
            name={enemy.name}
            level={enemy.level}
            icon={enemy.icon}
            health={enemy.stats.health}
            maxHealth={enemy.stats.maxHealth}
            energy={enemy.stats.energy}
            maxEnergy={enemy.stats.maxEnergy}
            isEnemy
          />
          
          <EffectsContainer>
            <EffectsTitle>Активные эффекты</EffectsTitle>
            <StatusEffects effects={enemy.effects} />
          </EffectsContainer>
        </CharacterContainer>
      </CombatArea>
      
      <ActionArea>
        <ActionBar
          actions={playerActions}
          onActionSelect={onActionSelect}
          disabled={disabled || !isPlayerTurn}
          currentEnergy={player.stats.energy}
        />
      </ActionArea>
      
      <LogArea>
        <CombatLog entries={combatLog} />
      </LogArea>
    </Container>
  );
}

export default CombatInterface;
