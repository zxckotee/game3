# План улучшения стилизации CultivationTab

## Обзор задачи
Применить тот же стиль улучшений к CultivationTab, что был использован для InventoryTab - градиентные панели, анимации и улучшенная типографика в стиле CharacterTab.

## Анализ текущего состояния CultivationTab

### Текущая структура:
- **CultivationTabStyles.js** - отдельный файл стилей
- **Container** - основной контейнер с простым fadeIn
- **Panel** - базовые панели с простыми границами
- **Tab** - вкладки с базовой стилизацией
- **Button** - кнопки с простыми эффектами
- **ProgressBar** - прогресс-бары с базовыми градиентами
- **StatItem** - простые элементы статистики

### Проблемы для улучшения:
- Простые прямоугольные панели без градиентных рамок
- Отсутствие анимации shimmer
- Базовая типографика без градиентных заголовков
- Простые статистические элементы без карточек
- Недостаточно интерактивности и визуальных эффектов

## Детальный план улучшений

### 1. Добавление анимации shimmer

```javascript
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;
```

### 2. Переработка Panel компонентов

Обновить базовый Panel с градиентными рамками:

```javascript
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
```

### 3. Улучшение Tab компонентов

```javascript
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
```

### 4. Переработка Button компонентов

```javascript
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
```

### 5. Улучшение ProgressBar

```javascript
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
```

### 6. Добавление градиентной типографики

```javascript
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
```

### 7. Переработка StatItem как карточки

```javascript
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
```

### 8. Улучшение Container

```javascript
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

export const CultivationArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;
```

## Порядок реализации

1. **Добавить анимацию shimmer** в keyframes
2. **Переработать Panel** - градиентные рамки и эффекты
3. **Улучшить Tab** - градиентные фоны и анимации
4. **Обновить Button** - градиентные эффекты и анимации
5. **Переработать ProgressBar** - улучшенные градиенты и эффекты
6. **Добавить градиентную типографику** - SectionTitle и PanelTitle
7. **Переработать StatItem** - карточки вместо простых элементов
8. **Обновить Container** - улучшенные отступы

## Ожидаемый результат

После реализации CultivationTab будет иметь:
- Единообразный стиль с InventoryTab и CharacterTab
- Градиентные панели с золотыми рамками
- Плавные анимации и эффекты мерцания
- Красивую типографику с градиентными заголовками
- Интерактивные карточки статистики
- Улучшенные прогресс-бары с анимациями
- Стильные кнопки и вкладки с эффектами наведения