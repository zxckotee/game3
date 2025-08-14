# Исправление проблемы с relationships торговцев

## Описание проблемы

При загрузке данных торговцев в интерфейсе игры скидка отображалась как 0.0%, хотя при покупке предметов скидка рассчитывалась корректно на основе relationships в character_profile.

## Причина проблемы

В маршруте `/api/merchants` в файле `src/server/routes/merchant-routes.js` функция `getAllMerchants()` вызывалась без передачи `userId`, из-за чего relationships пользователя не загружались и скидка не рассчитывалась.

### Проблемный код:
```javascript
// Строка 15 в merchant-routes.js
const merchants = await merchantService.getAllMerchants(); // userId не передавался!
```

### Цепочка вызовов:
1. **MarketTab.js** → `getAllMerchants(userId)` ✅ (userId передается)
2. **merchants-adapter.js** → `MerchantAPI.getAllMerchants(userId)` ✅ (userId передается)
3. **merchant-api.js** → API запрос с `userId` ✅ (userId передается)
4. **merchant-routes.js** → `merchantService.getAllMerchants()` ❌ (userId НЕ передавался!)

## Исправление

Изменена строка 15 в `src/server/routes/merchant-routes.js`:

```javascript
// ДО:
const merchants = await merchantService.getAllMerchants();

// ПОСЛЕ:
const merchants = await merchantService.getAllMerchants(userId);
```

## Как это работает

1. **Получение userId**: В маршруте userId извлекается из query параметров: `const userId = req.query.userId || 1;`

2. **Передача в сервис**: Теперь userId передается в `getAllMerchants(userId)`

3. **Загрузка relationships**: В `merchant-service.js` функция `getAllMerchants()` загружает relationships пользователя:
   ```javascript
   const profile = await CharacterProfile.findOne({
     where: { userId },
     attributes: ['relationships']
   });
   ```

4. **Форматирование с учетом репутации**: Функция `formatMerchant()` получает relationships и рассчитывает скидку:
   ```javascript
   function formatMerchant(merchant, userId = null, relationships = null) {
     if (userId && relationships) {
       const merchantRelationship = relationshipArray.find(rel => rel.id === String(plainMerchant.id));
       reputation = merchantRelationship ? merchantRelationship.level : 0;
       
       const reputationDiscount = calculateDiscountFromReputation(reputation) / 100;
       discount = Math.max(discount, reputationDiscount);
     }
   }
   ```

## Результат

Теперь при загрузке торговцев:
- ✅ Корректно загружаются relationships пользователя
- ✅ Рассчитывается скидка на основе репутации
- ✅ Скидка отображается в интерфейсе (например, 8.0% вместо 0.0%)
- ✅ Скидка применяется как при отображении, так и при покупке

## Файлы, затронутые исправлением

- `src/server/routes/merchant-routes.js` - основное исправление

## Тестирование

Для проверки исправления:
1. Откройте вкладку "Рынок" в игре
2. Перейдите на подвкладку "Торговцы"
3. Проверьте, что у торговцев отображается корректная скидка (не 0.0%)
4. Попробуйте купить предмет и убедитесь, что скидка применяется

## Связанные файлы

- `src/services/merchant-service.js` - содержит логику загрузки relationships
- `src/components/tabs/MarketTab.js` - фронтенд компонент
- `src/data/merchants-adapter.js` - адаптер для API
- `src/services/merchant-api.js` - API клиент