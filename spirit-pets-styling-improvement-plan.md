# План улучшения стилизации SpiritPetsTab

## Обзор задачи
Привести SpiritPetsTab в соответствие с единым стилем других табов, используя золотую цветовую гамму и современные стилистические решения. Компонент использует CSS классы, которые нужно заменить на styled-components.

## Анализ текущего состояния SpiritPetsTab

### Текущие особенности:
- **CSS классы** вместо styled-components
- **Базовая стилизация** без градиентов и анимаций
- **Модальные окна** с простым дизайном
- **Карточки питомцев** без современных эффектов
- **Индикаторы состояния** без градиентных эффектов

### Области для улучшения:
- **Анимации** - добавить fadeIn, shimmer, pulse
- **Градиентные панели** - с золотыми рамками и эффектами
- **Современные карточки питомцев** - с анимациями наведения
- **Улучшенные модальные окна** - с градиентными панелями
- **Градиентная типографика** - для заголовков
- **Современные кнопки** - с градиентными эффектами

## Детальный план улучшений

### 1. Добавление анимаций и styled-components

```javascript
import styled, { keyframes, css } from 'styled-components';

// Анимации
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

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

const petCardHover = keyframes`
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-5px);
  }
`;
```

### 2. Переработка основного контейнера

```javascript
const SpiritPetsContainer = styled.div`
  padding: 24px;
  color: #f0f0f0;
  animation: ${fadeIn} 0.6s ease-out;
  min-height: 100vh;
`;

const TabHeader = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

const TabTitle = styled.h2`
  font-size: 28px;
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const TabDescription = styled.p`
  font-size: 16px;
  color: #aaa;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
`;
```

### 3. Переработка карточек питомцев

```javascript
const PetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const PetCardContainer = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
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
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
    animation: ${pulse} 2s infinite;
  }
  
  ${props => props.isActive && css`
    border-color: rgba(212, 175, 55, 0.6);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
    
    &::before {
      background: linear-gradient(45deg, #f4d03f, #d4af37, #f4d03f);
    }
  `}
`;

const PetCardHeader = styled.div`
  background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  position: relative;
`;

const PetName = styled.h3`
  margin: 0 0 8px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: bold;
`;

const PetType = styled.div`
  color: #aaa;
  font-size: 14px;
`;

const ActiveBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  color: #000;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;
```

### 4. Улучшение индикаторов состояния

```javascript
const PetIndicators = styled.div`
  margin: 16px 0;
`;

const PetIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`;

const IndicatorName = styled.span`
  color: #aaa;
  font-size: 14px;
  min-width: 80px;
`;

const IndicatorBarContainer = styled.div`
  flex: 1;
  height: 8px;
  background: rgba(40, 40, 40, 0.8);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const IndicatorBar = styled.div`
  height: 100%;
  background: ${props => {
    if (props.type === 'hunger') {
      return props.value < 30 
        ? 'linear-gradient(45deg, #e74c3c, #c0392b)' 
        : 'linear-gradient(45deg, #2ecc71, #27ae60)';
    }
    if (props.type === 'loyalty') {
      return props.value < 50 
        ? 'linear-gradient(45deg, #e74c3c, #c0392b)' 
        : 'linear-gradient(45deg, #2ecc71, #27ae60)';
    }
    return 'linear-gradient(45deg, #d4af37, #f4d03f)';
  }};
  width: ${props => props.value}%;
  transition: width 0.3s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: ${shimmer} 2s infinite;
  }
`;

const IndicatorValue = styled.span`
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
`;
```

### 5. Переработка кнопок действий

```javascript
const PetActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

const PetActionButton = styled.button`
  background: ${props => {
    switch(props.variant) {
      case 'activate':
        return 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))';
      case 'feed':
        return 'linear-gradient(45deg, rgba(46, 204, 113, 0.2), rgba(39, 174, 96, 0.2))';
      case 'train':
        return 'linear-gradient(45deg, rgba(52, 152, 219, 0.2), rgba(41, 128, 185, 0.2))';
      case 'details':
        return 'linear-gradient(45deg, rgba(155, 89, 182, 0.2), rgba(142, 68, 173, 0.2))';
      default:
        return 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)';
    }
  }};
  color: ${props => {
    switch(props.variant) {
      case 'activate': return '#d4af37';
      case 'feed': return '#2ecc71';
      case 'train': return '#3498db';
      case 'details': return '#9b59b6';
      default: return '#aaa';
    }
  }};
  border: 1px solid ${props => {
    switch(props.variant) {
      case 'activate': return 'rgba(212, 175, 55, 0.4)';
      case 'feed': return 'rgba(46, 204, 113, 0.4)';
      case 'train': return 'rgba(52, 152, 219, 0.4)';
      case 'details': return 'rgba(155, 89, 182, 0.4)';
      default: return 'rgba(212, 175, 55, 0.2)';
    }
  }};
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 80px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: rgba(60, 60, 60, 0.3);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;
```

### 6. Улучшение модальных окон

```javascript
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  
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
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
`;

const ModalTitle = styled.h3`
  margin: 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: bold;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #aaa;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.2);
    color: #d4af37;
  }
`;
```

### 7. Улучшение статистик питомцев

```javascript
const PetStatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin: 16px 0;
`;

const PetStat = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
  }
`;

const StatName = styled.div`
  color: #aaa;
  font-size: 12px;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  color: #d4af37;
  font-size: 18px;
  font-weight: bold;
`;
```

## Порядок реализации

1. **Добавить styled-components и анимации**
2. **Переработать основной контейнер**
3. **Улучшить карточки питомцев**
4. **Переработать индикаторы состояния**
5. **Улучшить кнопки действий**
6. **Переработать модальные окна**
7. **Добавить градиентную типографику**
8. **Улучшить статистики питомцев**

## Ожидаемый результат

После реализации SpiritPetsTab будет иметь:
- Единообразный стиль с другими табами
- Золотую цветовую гамму с градиентными эффектами
- Современные анимации и эффекты наведения
- Красивые карточки питомцев с градиентными рамками
- Улучшенные индикаторы состояния с анимациями
- Современные модальные окна
- Градиентную типографику для заголовков
- Интерактивные кнопки с анимациями