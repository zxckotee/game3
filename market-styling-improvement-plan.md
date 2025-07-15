# План улучшения стилизации MarketTab

## Обзор задачи
Привести MarketTab в соответствие с единым стилем InventoryTab, CultivationTab и EquipmentTab, используя ту же золотую цветовую гамму и стилистические решения. Также увеличить размер картинок в карточках товаров до 64x64.

## Анализ текущего состояния MarketTab

### Текущие особенности:
- **Базовая стилизация** с простыми панелями
- **Золотая цветовая схема** уже частично присутствует (#ffd700)
- **Простые компоненты** без градиентов и анимаций
- **Маленькие иконки** 40x40 вместо требуемых 64x64

### Области для улучшения:
- **Анимации** - добавить fadeIn, shimmer, pulse
- **Градиентные панели** - с золотыми рамками и эффектами
- **Современные кнопки** - с градиентными эффектами
- **Улучшенные карточки** - с анимациями наведения
- **Размер иконок** - увеличить до 64x64
- **Градиентная типографика** - для заголовков

## Детальный план улучшений

### 1. Добавление анимаций

```javascript
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
```

### 2. Переработка TabContainer

```javascript
const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  color: #f0f0f0;
  animation: ${fadeIn} 0.6s ease-out;
`;
```

### 3. Улучшение панелей LeftPanel и RightPanel

```javascript
const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
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
`;

const RightPanel = styled(LeftPanel)``;
```

### 4. Улучшение TabButton

```javascript
const TabButton = styled.button`
  background: ${props => props.active 
    ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))' 
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'};
  color: ${props => props.active ? '#d4af37' : '#aaa'};
  border: 1px solid ${props => props.active ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 8px 8px 0 0;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
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
    border-bottom: 2px solid #d4af37;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(45deg, #d4af37, #f4d03f);
    }
  `}
`;
```

### 5. Переработка ItemCard

```javascript
const ItemCard = styled.div`
  display: flex;
  background: ${props => props.selected 
    ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.05) 100%)' 
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'};
  border: 1px solid ${props => props.selected ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 12px;
  padding: 16px;
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
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.05) 0%, rgba(244, 208, 63, 0.02) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
    
    &::before {
      left: 100%;
    }
  }
`;
```

### 6. Увеличение и улучшение ItemIcon

```javascript
const ItemIcon = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;
```

### 7. Улучшение ActionButton

```javascript
const ActionButton = styled.button`
  background: ${props => props.primary 
    ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))' 
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'};
  color: ${props => props.primary ? '#d4af37' : '#aaa'};
  border: 1px solid ${props => props.primary ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)'};
  border-radius: 8px;
  padding: 12px 20px;
  margin-top: 16px;
  font-size: 16px;
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
    background: ${props => props.primary 
      ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3))' 
      : 'linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.05) 100%)'};
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

### 8. Улучшение QuantityButton

```javascript
const QuantityButton = styled.button`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  color: #aaa;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
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
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.05) 100%);
    border-color: rgba(212, 175, 55, 0.4);
    color: #d4af37;
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: rgba(60, 60, 60, 0.3);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
  }
`;
```

### 9. Переработка ItemDetails

```javascript
const ItemDetails = styled.div`
  padding: 20px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  margin-top: 20px;
  position: relative;
  overflow: hidden;
  
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
```

### 10. Градиентная типографика

```javascript
const TabTitle = styled.h2`
  font-size: 24px;
  margin: 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const DetailTitle = styled.h3`
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.2rem;
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
```

## Порядок реализации

1. **Добавить анимации** - fadeIn, shimmer, pulse keyframes
2. **Обновить TabContainer** - добавить fadeIn анимацию
3. **Переработать панели** - LeftPanel и RightPanel с градиентными рамками
4. **Улучшить TabButton** - градиентные эффекты и анимации
5. **Переработать ItemCard** - современный дизайн с анимациями
6. **Увеличить ItemIcon** - до 64x64 с улучшенной стилизацией
7. **Обновить кнопки** - ActionButton и QuantityButton
8. **Переработать ItemDetails** - градиентные панели
9. **Добавить градиентную типографику** - TabTitle и DetailTitle

## Ожидаемый результат

После реализации MarketTab будет иметь:
- Единообразный стиль с другими табами
- Золотую цветовую гамму с градиентными эффектами
- Современные анимации и эффекты наведения
- Увеличенные иконки товаров 64x64
- Градиентные панели с эффектами мерцания
- Красивую типографику с градиентными заголовками
- Интерактивные кнопки с анимациями