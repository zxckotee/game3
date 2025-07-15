# План улучшения стилизации InventoryTab

## Обзор задачи
Необходимо улучшить стилизацию компонента InventoryTab, сделав его похожим на красивый интерфейс CharacterTab с градиентными панелями, анимациями и улучшенной типографикой.

## Анализ текущего состояния

### Текущие проблемы:
- Простые прямоугольные панели без градиентов
- Отсутствие анимаций и эффектов
- Базовая типографика без градиентных текстов
- Простые границы без золотых эффектов
- Статичные элементы без интерактивности

### Структура компонента:
- `Container` - основной контейнер с grid layout
- `InventoryGrid` - сетка для отображения предметов
- `ItemSlot` - слоты для предметов
- `ItemDetails` - панель деталей выбранного предмета
- `CurrencyInfo` - информация о валюте

## Детальный план улучшений

### 1. Добавление анимаций и keyframes

Нужно добавить следующие анимации из CharacterTab:

```javascript
// Анимация появления
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

// Анимация мерцания
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

// Анимация пульсации
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;
```

### 2. Переработка основного контейнера

Заменить простой grid на стильный контейнер с анимацией:

```javascript
const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;
```

### 3. Улучшение сетки инвентаря

Переработать `InventoryGrid` с градиентными панелями:

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

### 4. Улучшение слотов предметов

Переработать `ItemSlot` с улучшенными эффектами:

```javascript
const ItemSlot = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
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
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.15);
    animation: ${pulse} 2s infinite;
    
    &::before {
      left: 100%;
    }
  }
`;
```

### 5. Улучшение панели деталей предмета

Переработать `ItemDetails` с градиентными заголовками:

```javascript
const ItemDetails = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
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

### 6. Улучшение типографики

Добавить градиентные заголовки:

```javascript
const ItemName = styled.h3`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  font-size: 1.5rem;
  font-weight: bold;
`;

const SectionTitle = styled.h4`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 16px 0 8px;
  font-size: 1.1rem;
  font-weight: bold;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  padding-bottom: 4px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
  }
`;
```

### 7. Улучшение отображения валюты

Переработать `CurrencyInfo` с карточками:

```javascript
const CurrencyInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid rgba(212, 175, 55, 0.3);
`;

const CurrencyCard = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
  }
`;

const CurrencyLabel = styled.span`
  color: #aaa;
  font-size: 0.9rem;
`;

const CurrencyValue = styled.span`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 1rem;
`;
```

### 8. Улучшение кнопок действий

Переработать `ActionButton`:

```javascript
const ActionButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  color: #d4af37;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 12px;
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
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3));
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

## Порядок реализации

1. **Добавить анимации** - fadeIn, shimmer, pulse keyframes
2. **Обновить Container** - добавить fadeIn анимацию
3. **Переработать InventoryGrid** - градиентные панели и эффекты
4. **Улучшить ItemSlot** - анимации наведения и эффекты
5. **Обновить ItemDetails** - градиентные панели
6. **Улучшить типографику** - градиентные заголовки
7. **Переработать валютную информацию** - карточки вместо простого списка
8. **Обновить кнопки** - градиентные эффекты и анимации

## Ожидаемый результат

После реализации всех улучшений InventoryTab будет иметь:
- Современный дизайн с градиентными панелями
- Плавные анимации и эффекты наведения
- Красивую типографику с градиентными заголовками
- Интерактивные элементы с визуальной обратной связью
- Единообразный стиль с CharacterTab