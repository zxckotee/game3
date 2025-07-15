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

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

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

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
`;

export const Tab = styled.div`
  padding: 12px 24px;
  background: ${props => props.active
    ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'};
  color: ${props => props.active ? '#d4af37' : '#aaa'};
  border: 1px solid ${props => props.active ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 8px 8px 0 0;
  cursor: pointer;
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
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.1), rgba(244, 208, 63, 0.1));
    color: #d4af37;
    transform: translateY(-1px);
    
    &::before {
      left: 100%;
    }
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
      background: linear-gradient(45deg, #d4af37, #f4d03f);
    }
  `}
`;

export const CultivationArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

export const Panel = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out;
  transition: all 0.3s ease;
  
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.15);
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
  height: 24px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.5) 0%, rgba(40, 40, 40, 0.7) 100%);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(212, 175, 55, 0.2);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #d4af37, #ffdf00, #f4d03f, #d4af37);
    background-size: 200% 200%;
    animation: ${glow} 3s ease infinite;
    transition: width 0.5s ease;
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: ${shimmer} 2s infinite;
    pointer-events: none;
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
  font-size: 0.9rem;
`;

export const StatValue = styled.span`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 1rem;
`;

export const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: ${props => props.active
    ? 'linear-gradient(45deg, #d4af37, #f4d03f)'
    : 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))'};
  color: ${props => props.active ? '#1a1a1a' : '#d4af37'};
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
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
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0px);
  }
  
  &:disabled {
    background: rgba(60, 60, 60, 0.3);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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

export const SectionTitle = styled.h3`
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

export const PanelTitle = styled.h4`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: bold;
`;

export const StatCard = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
    
    &::before {
      left: 100%;
    }
  }
`;
