# План улучшения стилизации EquipmentTab

## Обзор задачи
Привести EquipmentTab в соответствие с единым стилем InventoryTab и CultivationTab, используя ту же цветовую гамму и стилистические решения.

## Анализ текущего состояния EquipmentTab

### Текущие особенности:
- **Уже имеет продвинутую стилизацию** с градиентами и анимациями
- **Использует синюю цветовую схему** вместо золотой
- **Хорошие анимации** borderGlow и shimmer
- **Продвинутые компоненты** с эффектами наведения

### Области для улучшения:
- **Цветовая схема** - привести к золотой гамме (#d4af37, #f4d03f)
- **FilterButton** - улучшить стилизацию для соответствия общему стилю
- **InventoryGrid** - привести к единому стилю с InventoryTab
- **ItemSlot** - обновить для соответствия общему дизайну
- **Кнопки** - UnequipButton и DropButton улучшить
- **Анимации** - добавить shimmer анимацию как в других табах

## Детальный план улучшений

### 1. Обновление цветовой схемы

Заменить синие оттенки на золотые во всех компонентах:

```javascript
// Основная золотая палитра
const goldPrimary = '#d4af37';
const goldSecondary = '#f4d03f';
const goldTertiary = '#b7950b';

// Градиенты для панелей
background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
border: 2px solid transparent;
background-clip: padding-box;

// Золотые рамки
&::before {
  background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
```

### 2. Добавление анимации shimmer

```javascript
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

// Применение к панелям
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
```

### 3. Улучшение FilterButton

```javascript
const FilterButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  color: #aaa;
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
    border-color: rgba(212, 175, 55, 0.4);
    color: #d4af37;
    transform: translateY(-1px);
    
    &::before {
      left: 100%;
    }
  }
  
  &.active {
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
    border-color: rgba(212, 175, 55, 0.4);
    color: #d4af37;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
  }
`;
```

### 4. Переработка InventoryGrid

```javascript
const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  padding: 24px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
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
```

### 5. Улучшение ItemSlot

```javascript
const ItemSlot = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.4)' :
    props.rarity === 'uncommon' ? 'rgba(33, 150, 243, 0.4)' :
    props.rarity === 'rare' ? 'rgba(156, 39, 176, 0.4)' :
    props.rarity === 'epic' ? 'rgba(255, 152, 0, 0.4)' : 'rgba(212, 175, 55, 0.4)'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.1)' :
      props.rarity === 'uncommon' ? 'rgba(33, 150, 243, 0.1)' :
      props.rarity === 'rare' ? 'rgba(156, 39, 176, 0.1)' :
      props.rarity === 'epic' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(212, 175, 55, 0.1)'}, transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
    border-color: ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.6)' :
      props.rarity === 'uncommon' ? 'rgba(33, 150, 243, 0.6)' :
      props.rarity === 'rare' ? 'rgba(156, 39, 176, 0.6)' :
      props.rarity === 'epic' ? 'rgba(255, 152, 0, 0.6)' : 'rgba(212, 175, 55, 0.6)'};
    box-shadow: 0 8px 25px ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.15)' :
      props.rarity === 'uncommon' ? 'rgba(33, 150, 243, 0.15)' :
      props.rarity === 'rare' ? 'rgba(156, 39, 176, 0.15)' :
      props.rarity === 'epic' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(212, 175, 55, 0.15)'};
    
    &::before {
      left: 100%;
    }
  }
  
  &.equipped {
    border-width: 2px;
    box-shadow: 0 0 15px ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.3)' :
      props.rarity === 'uncommon' ? 'rgba(33, 150, 243, 0.3)' :
      props.rarity === 'rare' ? 'rgba(156, 39, 176, 0.3)' :
      props.rarity === 'epic' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(212, 175, 55, 0.3)'};
  }
`;
```

### 6. Переработка кнопок UnequipButton и DropButton

```javascript
const UnequipButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, rgba(244, 67, 54, 0.2), rgba(229, 115, 115, 0.2));
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 8px;
  color: #f44336;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 12px;
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
    background: linear-gradient(90deg, transparent, rgba(244, 67, 54, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, rgba(244, 67, 54, 0.3), rgba(229, 115, 115, 0.3));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2);
    
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

const DropButton = styled(UnequipButton)`
  background: linear-gradient(45deg, rgba(156, 39, 176, 0.2), rgba(186, 104, 200, 0.2));
  border-color: rgba(156, 39, 176, 0.4);
  color: #9c27b0;
  
  &::before {
    background: linear-gradient(90deg, transparent, rgba(156, 39, 176, 0.1), transparent);
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, rgba(156, 39, 176, 0.3), rgba(186, 104, 200, 0.3));
    box-shadow: 0 4px 12px rgba(156, 39, 176, 0.2);
  }
`;
```

### 7. Обновление Container

```javascript
const Container = styled.div`
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg,
    rgba(15, 15, 35, 0.95) 0%,
    rgba(25, 25, 45, 0.9) 50%,
    rgba(35, 35, 55, 0.85) 100%
  );
  animation: fadeIn 0.6s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
```

## Порядок реализации

1. **Добавить анимацию shimmer** - keyframe для эффектов мерцания
2. **Обновить цветовую схему** - заменить синие оттенки на золотые
3. **Переработать FilterButton** - градиентные эффекты и анимации
4. **Улучшить InventoryGrid** - единый стиль с InventoryTab
5. **Обновить ItemSlot** - соответствие общему дизайну
6. **Переработать кнопки** - UnequipButton и DropButton
7. **Обновить Container** - улучшенная анимация fadeIn

## Ожидаемый результат

После реализации EquipmentTab будет иметь:
- Единообразный стиль с InventoryTab и CultivationTab
- Золотую цветовую гамму вместо синей
- Градиентные панели с эффектами мерцания
- Улучшенные кнопки с анимациями
- Стильные слоты предметов с эффектами наведения
- Современные фильтры с градиентными эффектами