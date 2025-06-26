import React from 'react';
import styled from 'styled-components';
import ResourceBar from './ResourceBar';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 300px;
`;

const PortraitContainer = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: ${props => props.isEnemy 
    ? 'radial-gradient(circle, rgba(50, 23, 23, 0.7) 0%, rgba(68, 20, 20, 0.8) 100%)'
    : 'radial-gradient(circle, rgba(23, 34, 50, 0.7) 0%, rgba(20, 40, 68, 0.8) 100%)'
  };
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.isEnemy 
    ? 'rgba(220, 20, 60, 0.4)'
    : 'rgba(100, 149, 237, 0.4)'
  };
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4);
  }
`;

const PortraitContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  text-shadow: 0 0 15px ${props => props.isEnemy 
    ? 'rgba(255, 100, 100, 0.7)'
    : 'rgba(100, 200, 255, 0.7)'
  };
  
  ${props => props.isEnemy && `
    transform: scaleX(-1);
  `}
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isEnemy
      ? 'radial-gradient(circle at 30% 30%, rgba(255, 100, 100, 0.2) 0%, transparent 60%)'
      : 'radial-gradient(circle at 30% 30%, rgba(100, 200, 255, 0.2) 0%, transparent 60%)'
    };
    pointer-events: none;
  }
`;

const NamePlate = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 80%, transparent 100%);
  padding: 15px 10px 10px;
  text-align: center;
`;

const Name = styled.div`
  color: ${props => props.isEnemy ? '#ff9e9e' : '#9ecaff'};
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
`;

const Level = styled.div`
  color: #e0e0e0;
  font-size: 0.9rem;
  font-weight: 300;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StyledResourceBar = styled(ResourceBar)`
  height: 15px;
`;

function Portrait({
  name,
  level,
  icon,
  health,
  maxHealth,
  energy,
  maxEnergy,
  hunger,
  loyalty,
  isPet = false,
  isEnemy = false
}) {
  return (
    <Container>
      <PortraitContainer isEnemy={isEnemy}>
        <PortraitContent isEnemy={isEnemy}>
          {icon}
        </PortraitContent>
        
        <NamePlate>
          <Name isEnemy={isEnemy}>{name}</Name>
          <Level>Уровень {level}</Level>
        </NamePlate>
      </PortraitContainer>
      
      <StatsContainer>
        <StyledResourceBar
          type="health"
          value={health}
          maxValue={maxHealth}
          label="Здоровье"
          // Добавляем data-атрибуты для доступа через DOM
          data-health={health}
          data-max-health={maxHealth}
        />
        
        {maxEnergy > 0 && !isEnemy && (
          <StyledResourceBar
            type="energy"
            value={energy}
            maxValue={maxEnergy}
            label="Энергия"
            // Добавляем data-атрибуты для доступа через DOM
            data-energy={energy}
            data-max-energy={maxEnergy}
          />
        )}
        
        {/* Отображаем сытость и лояльность только для питомцев */}
        {isPet && hunger !== undefined && (
          <StyledResourceBar
            type="hunger"
            value={hunger}
            maxValue={100}
            label="Сытость"
            data-hunger={hunger}
          />
        )}
        
        {isPet && loyalty !== undefined && (
          <StyledResourceBar
            type="loyalty"
            value={loyalty}
            maxValue={100}
            label="Лояльность"
            data-loyalty={loyalty}
          />
        )}
      </StatsContainer>
    </Container>
  );
}

export default Portrait;
