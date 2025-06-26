import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  margin-bottom: 5px;
`;

const BarContainer = styled.div`
  width: 100%;
  height: 22px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 11px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.6);
`;

const BarFill = styled.div`
  height: 100%;
  width: ${props => (props.value / props.maxValue) * 100}%;
  background: ${props => {
    const percentage = (props.value / props.maxValue) * 100;
    
    switch (props.type) {
      case 'health':
        if (percentage <= 20) return 'linear-gradient(to right, #8B0000, #d32f2f)';
        if (percentage <= 50) return 'linear-gradient(to right, #e65100, #fb8c00)';
        return 'linear-gradient(to right, #2e7d32, #4caf50)';
      case 'energy':
        return 'linear-gradient(to right, #1565C0, #42a5f5)';
      case 'hunger':
        if (percentage <= 30) return 'linear-gradient(to right, #8B0000, #d32f2f)';
        if (percentage <= 60) return 'linear-gradient(to right, #e65100, #fb8c00)';
        return 'linear-gradient(to right, #2e7d32, #4caf50)';
      case 'loyalty':
        if (percentage <= 25) return 'linear-gradient(to right, #8B0000, #d32f2f)';
        if (percentage <= 50) return 'linear-gradient(to right, #e65100, #fb8c00)';
        return 'linear-gradient(to right, #4A148C, #9c27b0)';
      default:
        return 'linear-gradient(to right, #424242, #757575)';
    }
  }};
  transition: width 0.3s ease-out;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 7px;
    background: rgba(255, 255, 255, 0.15);
    filter: blur(3px);
  }
`;

const BarText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 0.85rem;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  letter-spacing: 0.5px;
  z-index: 1;
`;

const Label = styled.div`
  color: #e0e0e0;
  font-size: 0.85rem;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.7);
`;

const Icon = styled.span`
  margin-right: 5px;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
`;

function ResourceBar({
  type = 'health',
  value,
  maxValue = 100, // Установим значение по умолчанию для maxValue
  label,
  showValues = true,
  showPercentage = false,
  className,
  ...props // Добавляем сбор всех дополнительных пропсов
}) {
  // Защита от деления на ноль или undefined
  const safeMaxValue = maxValue || 100;
  const safeValue = isNaN(value) ? 0 : Math.max(0, value || 0);
  const percentage = Math.round((safeValue / safeMaxValue) * 100);
  
  const icons = {
    health: '❤️',
    energy: '⚡',
    hunger: '🍖',
    loyalty: '🐾'
  };
  
  return (
    <Container className={className}>
      <Label>
        <div>
          <Icon>{icons[type]}</Icon>
          {label}
        </div>
        {showValues && (
          <div>
            {safeValue}/{safeMaxValue}
            {showPercentage && ` (${percentage}%)`}
          </div>
        )}
      </Label>
      
      <BarContainer {...props}> {/* Передаем все дополнительные пропсы (включая data-атрибуты) */}
        <BarFill
          type={type}
          value={safeValue}
          maxValue={safeMaxValue}
        />
        <BarText>
          {showValues ? `${safeValue}/${safeMaxValue}` : `${percentage}%`}
        </BarText>
      </BarContainer>
    </Container>
  );
}

export default ResourceBar;
