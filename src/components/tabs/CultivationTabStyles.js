import styled, { keyframes, css } from 'styled-components';

// Анимации
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(212, 175, 55, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(212, 175, 55, 0);
  }
`;

const glow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
`;

export const Tab = styled.div`
  padding: 10px 20px;
  background: ${props => props.active ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.3)'};
  color: ${props => props.active ? '#d4af37' : '#aaa'};
  border: 1px solid ${props => props.active ? '#d4af37' : 'transparent'};
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.1);
    color: #d4af37;
  }
  
  ${props => props.active && css`
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background: #d4af37;
    }
  `}
`;

export const CultivationArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

export const Panel = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.5s ease-in-out;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
  }
`;

export const MeditationPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;
export const BreakthroughPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const TribulationPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const TribulationResult = styled.div`
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  background: ${props => props.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
  color: ${props => props.success ? '#4caf50' : '#f44336'};
  border: 1px solid ${props => props.success ? '#4caf50' : '#f44336'};
`;

export const InsightPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const ProgressInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #d4af37, #ffdf00, #d4af37);
    background-size: 200% 200%;
    animation: ${glow} 3s ease infinite;
    transition: width 0.3s ease;
  }
`;

export const ProgressText = styled.div`
  text-align: center;
  font-size: 0.9rem;
  color: #aaa;
`;

export const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
`;

export const StatLabel = styled.span`
  color: #aaa;
`;

export const StatValue = styled.span`
  color: #d4af37;
`;

export const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: ${props => props.active ? '#d4af37' : 'rgba(0, 0, 0, 0.2)'};
  color: ${props => props.active ? '#000' : '#d4af37'};
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover:not(:disabled) {
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  
  &:disabled {
    background: #333;
    color: #666;
    cursor: not-allowed;
  }
  
  ${props => props.active && css`
    animation: ${pulse} 2s infinite;
  `}
`;

export const BreakthroughRequirements = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

export const Requirement = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  &::before {
    content: '•';
    color: ${props => props.met ? '#4caf50' : '#f44336'};
    transition: color 0.3s ease;
  }
  
  color: ${props => props.met ? '#4caf50' : '#f44336'};
  
  ${props => props.met && css`
    text-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
  `}
`;

export const ResourceList = styled.div`
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  animation: ${fadeIn} 0.5s ease-in-out;
  box-shadow: 0 0 5px rgba(212, 175, 55, 0.2);
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const ResourceItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.05);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

// Специальный компонент для прогресс-бара трибуляции
export const TribulationProgressBar = styled(ProgressBar)`
  box-shadow: 0 0 10px #d4af37;
  animation: ${pulse} 2s infinite;
`;


export const StatsPanel = styled(Panel)``;

export const RequirementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
`;
