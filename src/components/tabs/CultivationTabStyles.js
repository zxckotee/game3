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
  gap: 20px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.5) 0%, rgba(20, 20, 20, 0.7) 100%);
  
  &::before {
    background: linear-gradient(45deg, #d4af37, #f4d03f, #b7950b, #d4af37);
    background-size: 300% 300%;
    animation: ${glow} 4s ease infinite;
  }
  
  &::after {
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.15), transparent);
  }
  
  h3 {
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 20px;
    font-size: 1.4rem;
    font-weight: bold;
    text-align: center;
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
  }
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
  padding: 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeIn} 0.5s ease-in-out;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(20, 20, 20, 0.5) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 12px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 12px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
    opacity: 0.6;
  }
`;

export const Requirement = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => props.met
    ? 'linear-gradient(145deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)'
    : 'linear-gradient(145deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)'
  };
  border: 1px solid ${props => props.met ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
  
  &::before {
    content: ${props => props.met ? "'✓'" : "'✗'"};
    color: ${props => props.met ? '#4caf50' : '#f44336'};
    font-weight: bold;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    text-shadow: 0 0 5px ${props => props.met ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'};
  }
  
  color: ${props => props.met ? '#4caf50' : '#f44336'};
  font-weight: 500;
  
  ${props => props.met && css`
    text-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
    
    &:hover {
      background: linear-gradient(145deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.1) 100%);
      transform: translateX(4px);
    }
  `}
  
  ${props => !props.met && css`
    &:hover {
      background: linear-gradient(145deg, rgba(244, 67, 54, 0.15) 0%, rgba(244, 67, 54, 0.1) 100%);
    }
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

// Новые стили для красивого отображения ресурсов с картинками
export const ResourceGrid = styled.div`
  padding: 20px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.5) 0%, rgba(20, 20, 20, 0.7) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 20px;
  animation: ${fadeIn} 0.6s ease-in-out;
  position: relative;
  overflow: hidden;
  margin-top: 15px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #b7950b, #d4af37);
    background-size: 300% 300%;
    animation: ${glow} 5s ease infinite;
    border-radius: 20px;
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
    animation: ${shimmer} 4s infinite;
    pointer-events: none;
  }
  
  h4 {
    margin: 0 0 20px 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.2rem;
    font-weight: bold;
    text-align: center;
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 2px;
      background: linear-gradient(45deg, #d4af37, #f4d03f);
      border-radius: 1px;
    }
  }
`;

export const ResourceContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  padding: 15px 0;
  max-width: 100%;
  justify-items: center;
`;

export const ResourceSlot = styled.div`
  width: 100%;
  max-width: 140px;
  aspect-ratio: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid ${props => props.hasEnough ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  padding: 10px;
  animation: ${fadeIn} 0.6s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      ${props => props.hasEnough ? '#4caf50' : '#f44336'},
      ${props => props.hasEnough ? '#66bb6a' : '#ef5350'},
      ${props => props.hasEnough ? '#4caf50' : '#f44336'}
    );
    border-radius: 16px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
    opacity: ${props => props.hasEnough ? '0.8' : '0.6'};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent,
      ${props => props.hasEnough ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'},
      transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-4px) scale(1.08);
    border-color: ${props => props.hasEnough ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
    box-shadow: 0 12px 30px ${props => props.hasEnough ? 'rgba(76, 175, 80, 0.25)' : 'rgba(244, 67, 54, 0.25)'};
    
    &::before {
      opacity: 1;
    }
  }
`;

export const ResourceIcon = styled.img`
  width: 65%;
  height: 65%;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  
  ${ResourceSlot}:hover & {
    transform: scale(1.1);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
  }
`;

export const ResourceQuantity = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: bold;
  color: ${props => props.hasEnough ? '#4caf50' : '#f44336'};
  border: 1px solid ${props => props.hasEnough ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  
  ${ResourceSlot}:hover & {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

export const ResourceName = styled.div`
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%);
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid rgba(212, 175, 55, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  
  ${ResourceSlot}:hover & {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.2) 100%);
    border-color: rgba(212, 175, 55, 0.6);
    color: #d4af37;
    transform: translateY(-2px);
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
