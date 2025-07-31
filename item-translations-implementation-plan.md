# План реализации переводов для предметов

## Проблема
В компонентах MarketTab и InventoryTab отсутствуют переводы для:
- Качества/редкости предметов (common, rare, epic и т.д.)
- Типов предметов (weapon, armor, consumable и т.д.)

## Анализ текущего состояния

### Найденные проблемы в MarketTab:
1. **Строка 607**: `Тип: {selectedItem.type} | Качество: {selectedItem.quality}` - отображает английские значения
2. **Строки 260-268**: ItemName использует английские значения редкости для цветов
3. **Строки 829-836**: getCurrencyTypeByRarity использует английские значения

### Найденные проблемы в InventoryTab:
1. **Строка 607**: `Тип: {selectedItem.type} | Качество: {selectedItem.quality}` - отображает английские значения
2. **Строки 113-116**: ItemSlot использует английские значения качества для цветов границы

## Данные из базы данных

### Редкости (из sql/00_reference_tables.sql):
- `common` → `Обычный`
- `uncommon` → `Необычный`
- `rare` → `Редкий`
- `epic` → `Эпический`
- `legendary` → `Легендарный`
- `mythic` → `Мифический`

### Типы предметов (из sql/00_reference_tables.sql):
- `pill` → `Пилюли`
- `talisman` → `Талисманы`
- `weapon` → `Оружие`
- `armor` → `Броня`
- `accessory` → `Аксессуары`
- `consumable` → `Расходуемые`
- `resource` → `Ресурсы`

### Дополнительные типы (найдены в SQL файлах):
- `pet_food` → `Корм для питомцев`
- `book` → `Книги`

## Решение

### 1. Создать файл src/utils/itemTranslations.js

```javascript
/**
 * Утилиты для перевода типов и редкости предметов
 */

// Переводы редкости предметов
export const RARITY_TRANSLATIONS = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический'
};

// Переводы типов предметов
export const ITEM_TYPE_TRANSLATIONS = {
  pill: 'Пилюли',
  talisman: 'Талисманы',
  weapon: 'Оружие',
  armor: 'Броня',
  accessory: 'Аксессуары',
  consumable: 'Расходуемые',
  resource: 'Ресурсы',
  pet_food: 'Корм для питомцев',
  book: 'Книги'
};

// Цвета для редкости (сохраняем существующую логику)
export const RARITY_COLORS = {
  common: '#aaa',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
  mythic: '#e619e6'
};

// Цвета границ для редкости (для InventoryTab)
export const RARITY_BORDER_COLORS = {
  common: 'rgba(102, 102, 102, 0.4)',
  uncommon: 'rgba(33, 150, 243, 0.4)',
  rare: 'rgba(156, 39, 176, 0.4)',
  epic: 'rgba(255, 152, 0, 0.4)',
  legendary: 'rgba(212, 175, 55, 0.4)',
  mythic: 'rgba(230, 25, 230, 0.4)'
};

/**
 * Переводит английское название редкости на русский
 * @param {string} rarity - английское название редкости
 * @returns {string} русское название редкости
 */
export const translateRarity = (rarity) => {
  return RARITY_TRANSLATIONS[rarity] || rarity || 'Неизвестный';
};

/**
 * Переводит английское название типа предмета на русский
 * @param {string} itemType - английское название типа
 * @returns {string} русское название типа
 */
export const translateItemType = (itemType) => {
  return ITEM_TYPE_TRANSLATIONS[itemType] || itemType || 'Неизвестный';
};

/**
 * Получает цвет для редкости предмета
 * @param {string} rarity - редкость предмета
 * @returns {string} CSS цвет
 */
export const getRarityColor = (rarity) => {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
};

/**
 * Получает цвет границы для редкости предмета (для InventoryTab)
 * @param {string} rarity - редкость предмета
 * @returns {string} CSS цвет границы
 */
export const getRarityBorderColor = (rarity) => {
  return RARITY_BORDER_COLORS[rarity] || RARITY_BORDER_COLORS.common;
};

/**
 * Получает тип валюты по редкости (сохраняем существующую логику)
 * @param {string} rarity - редкость предмета
 * @returns {string} тип валюты
 */
export const getCurrencyTypeByRarity = (rarity) => {
  switch(rarity) {
    case 'common':
    case 'uncommon':
      return 'copper';
    case 'rare':
      return 'silver';
    case 'epic':
    case 'legendary':
    case 'mythic':
      return 'gold';
    default:
      return 'copper';
  }
};
```

### 2. Обновить MarketTab.js

#### Изменения:
1. Импортировать функции перевода
2. Заменить прямое отображение `selectedItem.type` и `selectedItem.quality` на переведенные версии
3. Обновить функцию `getCurrencyTypeByRarity` для использования новой утилиты
4. Обновить цвета в `ItemName` для использования новой утилиты

#### Конкретные места для изменений:
- **Строка 607**: Заменить на `Тип: ${translateItemType(selectedItem.type)} | Качество: ${translateRarity(selectedItem.quality)}`
- **Строки 260-268**: Заменить switch на `getRarityColor(props.rarity)`
- **Строки 829-836**: Заменить функцию на импорт из утилит

### 3. Обновить InventoryTab.js

#### Изменения:
1. Импортировать функции перевода
2. Заменить прямое отображение `selectedItem.type` и `selectedItem.quality` на переведенные версии
3. Обновить цвета границ в `ItemSlot` для использования новой утилиты

#### Конкретные места для изменений:
- **Строка 607**: Заменить на `Тип: ${translateItemType(selectedItem.type)} | Качество: ${translateRarity(selectedItem.quality)}`
- **Строки 113-116**: Заменить логику определения цвета границы на `getRarityBorderColor(props.quality)`
- **Строки 133-137**: Обновить цвета в hover эффектах
- **Строки 142-149**: Обновить цвета в box-shadow

## Преимущества решения

1. **Централизованность**: Все переводы в одном месте
2. **Переиспользование**: Функции можно использовать в других компонентах
3. **Расширяемость**: Легко добавить новые типы и редкости
4. **Совместимость**: Сохраняет существующую логику цветов и валют
5. **Fallback**: Если перевод не найден, отображается оригинальное значение

## Тестирование

После реализации нужно проверить:
1. Корректное отображение переведенных типов в MarketTab
2. Корректное отображение переведенных редкостей в MarketTab
3. Корректное отображение переведенных типов в InventoryTab
4. Корректное отображение переведенных редкостей в InventoryTab
5. Сохранение цветовой схемы для редкостей
6. Работоспособность существующей логики валют

## Следующие шаги

1. Создать файл `src/utils/itemTranslations.js`
2. Обновить `src/components/tabs/MarketTab.js`
3. Обновить `src/components/tabs/InventoryTab.js`
4. Протестировать изменения
5. Создать документацию по использованию