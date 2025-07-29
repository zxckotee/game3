# Анализ пути от кнопки "Попытаться совершить прорыв" до сервера

## Путь выполнения:

1. **Кнопка в UI** (`CultivationTab.js:1067`)
   ```javascript
   <S.Button onClick={handleBreakthrough}>
     Попытаться совершить прорыв
   </S.Button>
   ```

2. **Обработчик клика** (`CultivationTab.js:532`)
   ```javascript
   const handleBreakthrough = useCallback(() => {
     // Проверка возможности прорыва
     const checkResult = await CultivationAdapter.checkBreakthroughPossibility(userId);
     
     if (checkResult && checkResult.canBreakthrough) {
       // Выполнение прорыва
       const result = await CultivationAdapter.performBreakthrough(userId);
     }
   });
   ```

3. **Адаптер** (`cultivation-adapter.js:8`)
   ```javascript
   const CultivationServiceAPI = require('./cultivation-api');
   ```

4. **API клиент** (`cultivation-api.js:238`)
   ```javascript
   static async performBreakthrough(userId) {
     const response = await fetch(`${API_URL}/cultivation/${userId}/breakthrough`, {
       method: 'POST'
     });
   }
   ```

5. **Серверный роут** (`user_or_cultivation-routes.js:258`)
   ```javascript
   router.post('/api/cultivation/:userId/breakthrough', async (req, res) => {
     const result = await CultivationService.performBreakthrough(userId);
     res.json(result);
   });
   ```

6. **Серверный сервис** (`cultivation-service.js:836`)
   ```javascript
   static async performBreakthrough(userId) {
     const checkResult = await this.checkBreakthroughPossibility(userId);
     if (!checkResult.canBreakthrough) {
       return { success: false };
     }
     // Обновление данных культивации
   }
   ```

## Проблемы обнаружены:

### 1. Отсутствует проверка ресурсов на сервере
В методе `checkBreakthroughPossibility` (`cultivation-service.js:413`) проверяются только:
- Опыт (`hasEnoughExperience`)
- Энергия (`hasEnoughEnergy`) 
- Трибуляция (`passedTribulation`)
- Прогресс бутылочного горлышка (`passedBottleneck`)

**НО НЕТ проверки ресурсов из инвентаря!**

### 2. Отсутствует расходование ресурсов
В методе `performBreakthrough` (`cultivation-service.js:836`) НЕТ логики расходования ресурсов из инвентаря пользователя.

### 3. Несоответствие клиента и сервера
- **Клиент** показывает требуемые ресурсы и их количество
- **Сервер** не проверяет и не расходует эти ресурсы

## Необходимые исправления:

1. **Добавить проверку ресурсов в `checkBreakthroughPossibility`**
   - Получить требуемые ресурсы для текущего уровня
   - Проверить наличие в инвентаре пользователя
   - Добавить в `missingRequirements` если недостаточно

2. **Добавить расходование ресурсов в `performBreakthrough`**
   - После успешной проверки удалить ресурсы из инвентаря
   - Использовать транзакцию для атомарности операции

3. **Синхронизировать логику клиента и сервера**
   - Использовать одинаковые алгоритмы определения требуемых ресурсов
   - Обеспечить консистентность данных

## Статические данные ресурсов:
Уже реализованы в клиенте (`CultivationTab.js:256`), нужно перенести на сервер.