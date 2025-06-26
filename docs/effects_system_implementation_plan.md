# План реализации системы эффектов

## Цель
Модифицировать `CharacterStatsService` для расчета характеристик персонажа с учетом всех активных временных эффектов.

## Шаг 1: Добавление нового метода в `CharacterStatsService`

Будет добавлен новый статический метод `getCombinedCharacterState(userId, transaction)` в файл `src/services/character-stats-service.js`.

### Логика метода `getCombinedCharacterState`

1.  **Параллельная загрузка данных:**
    *   `baseStats = await this.getCharacterStats(userId, transaction);`
    *   `cultivationProgress = await CultivationService.getCultivationProgress(userId, transaction);`
    *   `activeEffects = await ActivePlayerEffect.findAll({ where: { user_id: userId }, transaction });`

2.  **Создание базового и модифицируемого состояний:**
    *   `baseState = { ...baseStats, ...cultivationProgress };`
    *   `modifiedState = { ...baseState };`

3.  **Применение эффектов:**
    *   Итерация по `activeEffects`.
    *   Внутри цикла, `details = effect.effect_details_json;`.
    *   Использование `switch (details.target_attribute)` для применения модификаций к `modifiedState`.
        *   **Пример для `strength_increase`:**
            ```javascript
            if (details.value_type === 'absolute') {
              modifiedState.strength += details.value;
            } else if (details.value_type === 'percentage') {
              modifiedState.strength += baseState.strength * (details.value / 100);
            }
            ```
        *   **Важно:** Для процентных модификаторов расчет должен производиться от *базового* значения (`baseState`), чтобы избежать неконтролируемого сложения процентов.

4.  **Расчет вторичных характеристик:**
    *   `secondaryStats = this.calculateSecondaryStats(modifiedState, modifiedState);` (передаем `modifiedState` в оба аргумента, так как он содержит все необходимые данные).

5.  **Возврат результата:**
    *   Вернуть структурированный объект:
        ```javascript
        return {
          base: baseState,
          modified: modifiedState,
          secondary: secondaryStats
        };
        ```

## Шаг 2: Рефакторинг `getSecondaryStats`

Существующий метод `getSecondaryStats` будет изменен, чтобы он использовал новую логику.

*   **Старая логика:** `const stats = await this.getCharacterStats(userId);`
*   **Новая логика:**
    ```javascript
    const combinedState = await this.getCombinedCharacterState(userId);
    return combinedState.secondary;
    ```

## Шаг 3: Создание `EffectLifecycleService`

Будет создан новый файл `src/services/effect-lifecycle-service.js` для очистки истекших эффектов.

*   **Метод:** `cleanupExpiredEffects()`
*   **Логика:** `DELETE FROM active_player_effects WHERE expires_at < NOW()`
*   **Интеграция:** Добавить `setInterval(() => EffectLifecycleService.cleanupExpiredEffects(), 600000);` (каждые 10 минут) в `src/server.js`.