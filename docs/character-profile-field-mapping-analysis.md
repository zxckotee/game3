# Анализ несоответствий полей в модели CharacterProfile

## Проблема
При создании профиля персонажа возникает ошибка: "значение NULL в столбце "user_id" отношения "character_profile" нарушает ограничение NOT NULL"

## Корень проблемы
Несоответствие между определением модели Sequelize и использованием полей в сервисах.

## Детальный анализ

### 1. Модель CharacterProfile (src/models/character-profile.js)

**Настройки модели:**
- `underscored: true` - автоматическое преобразование camelCase в snake_case
- `timestamps: true` - автоматические поля created_at/updated_at

**Определение полей:**
```javascript
userId: {
  type: DataTypes.INTEGER,
  field: 'user_id', // Маппинг на snake_case поле в БД
  // ...
},
spiritStones: {
  type: DataTypes.INTEGER,
  field: 'spirit_stones', // Маппинг на snake_case поле в БД
  // ...
}
```

### 2. Использование в сервисах

**Проблемные места в character-profile-service.js:**

#### createInitialProfile (строка 740-756)
```javascript
const profile = await CharacterProfile.create({
  user_id: userId,        // ❌ ОШИБКА: должно быть userId
  // ...
  spiritStones: 0,        // ✅ Правильно
}, { transaction });
```

#### Другие методы с аналогичными проблемами:
- `getProfile()` - строки 113-115, 232-234, 289-291, 332-334
- `updateCurrency()` - строки 378-380, 410-412, 454-456
- `getProfileByUserId()` - строки 525-526, 598-600, 665-667
- `updateAvatar()` - строки 805-807, 819-821, 862-864

### 3. Несоответствия в других сервисах

#### character-stats-service.js
- Строки 736-738, 791-793, 862-864: `where: { user_id: userId }`
- Строки 768, 839, 931: `spiritStones: profile.spirit_stones` (смешанное использование)

#### Другие сервисы с проблемами:
- **combat-service.js**: использует `user_id` в запросах
- **pvp-service.js**: множественные использования `user_id`
- **effects-service.js**: использует `user_id` в запросах
- **alchemy-service.js**: использует `user_id` в запросах

### 4. Состояние других моделей

**Модели с правильной настройкой underscored: true:**
- User, CharacterStats, Combat, Effect, Achievement, PvP модели
- Все используют camelCase в коде и автоматический маппинг на snake_case в БД

**Модели с проблемами:**
- CharacterProfile - смешанное использование полей в сервисах

## Рекомендуемое решение

### Вариант 1: Исправить сервисы (РЕКОМЕНДУЕТСЯ)
Привести все сервисы к использованию camelCase полей в соответствии с моделью:

```javascript
// Вместо:
where: { user_id: userId }
// Использовать:
where: { userId: userId }

// Вместо:
user_id: userId
// Использовать:
userId: userId
```

### Вариант 2: Изменить модель
Убрать `underscored: true` и использовать snake_case напрямую (НЕ РЕКОМЕНДУЕТСЯ)

## Файлы требующие исправления

### Критические (вызывают ошибки):
1. `src/services/character-profile-service.js` - метод `createInitialProfile`

### Важные (потенциальные проблемы):
1. `src/services/character-profile-service.js` - все методы с запросами
2. `src/services/character-stats-service.js` - методы работы с профилем
3. `src/services/combat-service.js` - запросы к CharacterProfile
4. `src/services/pvp-service.js` - запросы к различным моделям
5. `src/services/effects-service.js` - запросы к Effect модели
6. `src/services/alchemy-service.js` - запросы к различным моделям

## Приоритет исправлений

1. **Высокий**: character-profile-service.js - createInitialProfile
2. **Средний**: остальные методы character-profile-service.js
3. **Низкий**: другие сервисы (для консистентности)

## Тестирование

После исправлений необходимо протестировать:
1. Создание нового пользователя и профиля
2. Обновление валюты персонажа
3. Загрузка профиля персонажа
4. Обновление аватара