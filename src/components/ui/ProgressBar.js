import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const ProgressBarContainer = styled.div`
  width: 100%;
  height: ${props => props.height || '10px'};
  background-color: ${props => props.backgroundColor || 'rgba(0, 0, 0, 0.2)'};
  border-radius: ${props => props.height ? `${parseInt(props.height) / 2}px` : '5px'};
  overflow: hidden;
  margin: ${props => props.margin || '0'};
  box-shadow: ${props => props.showShadow ? 'inset 0 1px 3px rgba(0, 0, 0, 0.2)' : 'none'};
  position: relative;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => Math.min(Math.max(props.progress, 0), 100)}%;
  background-color: ${props => {
    if (props.color) return props.color;
    
    // Цвет зависит от прогресса, если не указан явно
    if (props.progress < 25) return '#c43b3b'; // красный для низкого прогресса
    if (props.progress < 50) return '#c49b3b'; // желтый для среднего прогресса
    if (props.progress < 75) return '#8bc43b'; // зеленовато-желтый для хорошего прогресса
    return '#4a8f52'; // зеленый для высокого прогресса
  }};
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: ${props => props.height ? `${parseInt(props.height) / 2}px` : '5px'};
  
  /* Градиентное оформление для более привлекательного вида */
  background-image: ${props => props.gradient ? 
    'linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3))' : 
    'none'};
  
  /* Эффект блика при hover */
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  ${props => props.interactive && `
    &:hover::after {
      opacity: 0.8;
    }
  `}
`;

const ProgressLabel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${props => props.labelColor || '#fff'};
  font-size: ${props => props.labelSize || '12px'};
  font-weight: bold;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.7);
  z-index: 1;
  white-space: nowrap;
`;

const StageIndicators = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
`;

const StageIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#d4af37' : 'rgba(150, 150, 150, 0.3)'};
  transition: background-color 0.3s ease;
  position: relative;
  
  &::after {
    content: '${props => props.stage}';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 3px;
  }
`;

/**
 * Компонент прогресс-бара для отображения прогресса выполнения задач
 */
const ProgressBar = ({ 
  progress = 0,
  color,
  height = '10px',
  backgroundColor,
  showLabel = false,
  labelText,
  labelColor,
  labelSize,
  margin,
  showShadow = true,
  gradient = true,
  interactive = false,
  stages = 0,
  currentStage = 0,
  className
}) => {
  
  // Вычисляем текст метки, если он не указан явно
  const calculatedLabel = labelText || `${Math.round(progress)}%`;
  
  return (
    <div className={className}>
      <ProgressBarContainer 
        height={height} 
        backgroundColor={backgroundColor}
        margin={margin}
        showShadow={showShadow}
      >
        <ProgressFill 
          progress={progress} 
          color={color}
          height={height}
          gradient={gradient}
          interactive={interactive}
        />
        {showLabel && (
          <ProgressLabel
            labelColor={labelColor}
            labelSize={labelSize}
          >
            {calculatedLabel}
          </ProgressLabel>
        )}
      </ProgressBarContainer>
      
      {stages > 0 && (
        <StageIndicators>
          {Array.from({length: stages}, (_, i) => (
            <StageIndicator 
              key={i} 
              active={i < currentStage}
              stage={i+1}
            />
          ))}
        </StageIndicators>
      )}
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.number,
  color: PropTypes.string,
  height: PropTypes.string,
  backgroundColor: PropTypes.string,
  showLabel: PropTypes.bool,
  labelText: PropTypes.string,
  labelColor: PropTypes.string,
  labelSize: PropTypes.string,
  margin: PropTypes.string,
  showShadow: PropTypes.bool,
  gradient: PropTypes.bool,
  interactive: PropTypes.bool,
  stages: PropTypes.number,
  currentStage: PropTypes.number,
  className: PropTypes.string
};

export default ProgressBar;
