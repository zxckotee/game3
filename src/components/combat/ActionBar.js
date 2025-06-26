import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 15px;
  padding: 5px;
`;

const ActionButton = styled.button`
  position: relative;
  background: ${props => props.disabled 
    ? 'linear-gradient(to bottom, rgba(40, 40, 40, 0.95), rgba(30, 30, 30, 0.95))' 
    : 'linear-gradient(to bottom, rgba(53, 46, 21, 0.95), rgba(43, 36, 11, 0.95))'
  };
  border: 1px solid ${props => props.disabled 
    ? 'rgba(102, 102, 102, 0.5)' 
    : 'rgba(212, 175, 55, 0.7)'
  };
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px 12px;
  color: ${props => props.disabled ? '#777' : '#ffd700'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(.25,.8,.25,1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: ${props => props.disabled ? 0.8 : 1};
  font-weight: ${props => props.disabled ? 'normal' : 'bold'};
  text-shadow: ${props => props.disabled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.5)'};
  
  &:hover:not(:disabled) {
    background: linear-gradient(to bottom, rgba(73, 66, 41, 0.95), rgba(63, 56, 31, 0.95));
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.2);
    color: #fff07c;
    border-color: rgba(255, 215, 0, 0.8);
  }
  
  &:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1);
    background: linear-gradient(to bottom, rgba(43, 36, 11, 0.95), rgba(53, 46, 21, 0.95));
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 100%
    );
    border-radius: 9px 9px 0 0;
  }
`;

const ActionIcon = styled.div`
  font-size: 2rem;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
  margin-bottom: 5px;
`;

const ActionName = styled.div`
  font-size: 1rem;
  text-align: center;
  margin-bottom: 2px;
  letter-spacing: 0.5px;
`;

const ActionCost = styled.div`
  font-size: 0.9rem;
  color: ${props => props.disabled ? '#777' : '#72bbff'};
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const ActionCooldown = styled.div`
  font-size: 0.9rem;
  color: ${props => props.disabled ? '#777' : '#ff7f7f'};
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #d4af37;
  border-radius: 4px;
  padding: 8px;
  width: max-content;
  max-width: 200px;
  margin-bottom: 8px;
  z-index: 100;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${ActionButton}:hover & {
    opacity: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #d4af37 transparent transparent transparent;
  }
`;

const TooltipTitle = styled.div`
  color: #d4af37;
  font-weight: bold;
  margin-bottom: 4px;
`;

const TooltipDescription = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const TooltipStats = styled.div`
  margin-top: 4px;
  font-size: 0.8rem;
  
  div {
    display: flex;
    justify-content: space-between;
    color: ${props => props.type === 'positive' ? '#4caf50' : '#f44336'};
  }
`;

const actionIcons = {
  attack: '⚔️',
  defend: '🛡️',
  heal: '💚',
  flee: '🏃'
};

function ActionBar({
  actions = [],
  onActionSelect,
  disabled = false,
  currentEnergy = 0
}) {
  const isActionAvailable = (action) => {
    if (disabled) return false;
    if (action.energyCost > currentEnergy) return false;
    if (action.cooldown > 0) return false;
    // Добавляем проверку на собственный флаг disabled у действия
    // (используется для способностей питомца при низкой сытости)
    if (action.disabled) return false;
    return true;
  };
  
  // Функция для определения причины, почему действие недоступно
  const getDisabledReason = (action) => {
    if (disabled) return "Сейчас не ваш ход";
    if (action.energyCost > currentEnergy) return `Недостаточно энергии (нужно ${action.energyCost})`;
    if (action.cooldown > 0) return `Перезарядка (${action.cooldown} ходов)`;
    if (action.disabled && action.type === 'petAbility') return "Питомцу не хватает сытости (нужно минимум 20%)";
    if (action.disabled) return "Действие недоступно";
    return "";
  };
  
  return (
    <Container>
      {actions.map((action, index) => {
        const isAvailable = isActionAvailable(action);
        
        return (
          <ActionButton
            key={`${action.name}-${index}`}
            onClick={() => isAvailable && onActionSelect(action)}
            disabled={!isAvailable}
          >
            <ActionIcon>
              {action.icon || actionIcons[action.type] || '❓'}
            </ActionIcon>
            
            <ActionName>{action.name}</ActionName>
            
            {action.energyCost > 0 && (
              <ActionCost disabled={!isAvailable}>
                ⚡ {action.energyCost}
              </ActionCost>
            )}
            
            {action.cooldown > 0 && (
              <ActionCooldown disabled={!isAvailable}>
                🕒 {action.cooldown}
              </ActionCooldown>
            )}
            
            <Tooltip>
              <TooltipTitle>{action.name}</TooltipTitle>
              
              <TooltipDescription>
                {action.description}
              </TooltipDescription>
              
              {!isAvailable && (
                <TooltipDescription style={{ color: '#ff6b6b', marginTop: '5px', fontWeight: 'bold' }}>
                  {getDisabledReason(action)}
                </TooltipDescription>
              )}
              
              {/* Используем calculatedDamage, если он определен, иначе используем базовый damage */}
              {(action.calculatedDamage || action.damage) && (
                <TooltipStats type="negative">
                  <div>
                    <span>Урон:</span>
                    <span>{action.calculatedDamage || action.damage}</span>
                  </div>
                </TooltipStats>
              )}
              
              {action.healing && (
                <TooltipStats type="positive">
                  <div>
                    <span>Лечение:</span>
                    <span>{action.healing}</span>
                  </div>
                </TooltipStats>
              )}
              
              {action.type === 'petAbility' && (
                <TooltipDescription style={{ color: '#f39c12', marginTop: '5px', fontSize: '0.8rem' }}>
                  Использование способности уменьшает сытость питомца на 20% и снижает лояльность
                </TooltipDescription>
              )}
              
              {action.effects?.map((effect, index) => (
                <TooltipDescription key={index}>
                  {effect.description}
                </TooltipDescription>
              ))}
            </Tooltip>
          </ActionButton>
        );
      })}
    </Container>
  );
}

export default ActionBar;
