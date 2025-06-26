# План Реализации Механики Использования Алхимических Предметов

## 1. Обновление/Создание SQL Скриптов и Моделей Sequelize

Все новые таблицы будут созданы с именами в `snake_case`. Модели Sequelize будут использовать эти имена таблиц, но могут иметь представления в `CamelCase` для совместимости.

*   **Таблица `alchemy_items` -> Модель `AlchemyItem`** (`src/models/alchemy-item.js`):
    *   Проверить и при необходимости обновить существующую модель для полного соответствия SQL-таблице (`sql/06_alchemy_items.sql`).
    *   Добавить/обновить ассоциации: `hasMany` `AlchemyItemEffect`, `hasMany` `AlchemyItemProperty`, `hasMany` `AlchemyItemStat`.

*   **Таблица `alchemy_item_effects` -> Модель `AlchemyItemEffect` (новая)**:
    *   SQL-скрипт для создания таблицы (если отличается от существующей в `sql/06_alchemy_items.sql` с учетом стандартизации `description`).
    *   Поля модели: `id` (PK), `item_id` (FK к `alchemy_items.id`), `effect_type` (STRING), `description` (TEXT, стандартизированный формат).
    *   Ассоциация: `belongsTo` `AlchemyItem`.

*   **Таблица `alchemy_item_properties` -> Модель `AlchemyItemProperty` (новая)**:
    *   SQL-скрипт для создания таблицы (согласно `sql/06_alchemy_items.sql`).
    *   Поля модели: `id` (PK), `item_id` (FK к `alchemy_items.id`), `property_name` (STRING), `property_value` (INTEGER).
    *   Ассоциация: `belongsTo` `AlchemyItem`.

*   **Таблица `alchemy_item_stats` -> Модель `AlchemyItemStat` (новая)**:
    *   SQL-скрипт для создания таблицы (согласно `sql/06_alchemy_items.sql`).
    *   Поля модели: `id` (PK), `item_id` (FK к `alchemy_items.id`), `category` (STRING), `stat_name` (STRING), `stat_value` (DECIMAL).
    *   Ассоциация: `belongsTo` `AlchemyItem`.

*   **Таблица `cultivation_progresses` -> Модель `CultivationProgress`** (`src/models/cultivation-progress.js`):
    *   Проверить и при необходимости обновить для соответствия SQL (`sql/11_cultivation_progress.sql`).

*   **Таблица `user_item_cooldowns` (новая) -> Модель `UserItemCooldown` (новая)**:
    *   SQL-скрипт для создания таблицы `user_item_cooldowns`.
    *   Поля модели: `id` (PK, SERIAL), `user_id` (INTEGER, FK к `users.id`), `item_id` (STRING, FK к `alchemy_items.id`), `cooldown_ends_at` (TIMESTAMP WITH TIME ZONE).
    *   Ассоциации: `belongsTo` `User`, `belongsTo` `AlchemyItem`.

*   **Таблица `active_player_effects` (новая) -> Модель `ActivePlayerEffect` (новая)**:
    *   SQL-скрипт для создания таблицы `active_player_effects`.
    *   Поля модели: `id` (PK, SERIAL), `user_id` (INTEGER, FK к `users.id`), `source_item_id` (STRING, FK к `alchemy_items.id`, nullable), `effect_type` (STRING), `effect_details_json` (JSONB, для хранения распарсенных параметров эффекта), `applied_at` (TIMESTAMP WITH TIME ZONE, DEFAULT CURRENT_TIMESTAMP), `duration_seconds` (INTEGER), `expires_at` (TIMESTAMP WITH TIME ZONE).
    *   Ассоциации: `belongsTo` `User`, `belongsTo` `AlchemyItem` (как `sourceItem`).

*   **Обновление `src/models/index.js`**:
    *   Добавить импорт и инициализацию всех новых моделей.
    *   Определить все необходимые ассоциации между моделями.

## 2. Стандартизация формата `description` в `alchemy_item_effects`

*   Необходимо определить четкий, машиночитаемый формат для поля `description`.
    *   **Предлагаемый формат**: `ДЕЙСТВИЕ[параметр1=значение1;параметр2=значение2;длительность=ЧЧ:ММ:СС|XhXmXs;стат=имя_стата;изменение=ЗНАКчисло%]`.
    *   Примеры:
        *   `RESTORE[target=energy;value=30;unit=points]`
        *   `BUFF[target_stat=cultivation_speed;modifier_type=percent;value=10;duration=1h]`
        *   `BUFF[target_stat=qi_control;modifier_type=percent;value=5;temporary=true;duration=30m]`
        *   `REMOVE_EFFECTS[type=debuff;scope=all]`
        *   `MODIFY_BREAKTHROUGH[target=chance;value=25;unit=percent;attempts=1]`
*   **Важно**: Потребуется отдельная задача (возможно, миграция данных) для обновления существующих записей в `alchemy_item_effects.description` к этому новому стандарту.

## 3. Реализация Логики Парсинга Стандартизированного `description`

*   Создать утилитарную функцию (например, в `src/utils/effect-parser.js`) или метод внутри `AlchemyService`.
*   Функция будет принимать строку `description` и возвращать структурированный JavaScript объект.
    *   Пример: `parseEffectDescription("BUFF[target_stat=cultivation_speed;value=10;unit=percent;duration=1h]")` -> `{ action: 'BUFF', params: { target_stat: 'cultivation_speed', value: 10, unit: 'percent', duration: 3600 } }`.

## 4. Реализация Методов в Сервисе `src/services/alchemy-service.js`

*   **`async useConsumableItem(userId, itemId, quantity = 1)`**:
    1.  **Проверки**:
        *   Найти `AlchemyItem` по `itemId`. Убедиться, что он существует и его `type` равен 'consumable'.
        *   Проверить инвентарь пользователя (`InventoryItem`) на наличие `itemId` в достаточном количестве (`quantity`).
        *   Проверить таблицу `UserItemCooldowns`: есть ли активный cooldown для `userId` и `itemId`.
    2.  **Потребление Предмета**:
        *   Уменьшить количество `itemId` в `InventoryItem` пользователя.
    3.  **Получение и Применение Эффектов**:
        *   Загрузить все связанные `AlchemyItemEffect` для `itemId`.
        *   Для каждого `AlchemyItemEffect`:
            *   Распарсить его `description`.
            *   На основе распарсенного `action` и `params`:
                *   **Мгновенные изменения**: Обновить `CultivationProgress` или `CharacterStats`.
                *   **Временные эффекты/баффы**: Создать запись в `active_player_effects`.
                *   **Специальная логика**: Реализовать для уникальных `effect_type`.
    4.  **Управление Cooldown**:
        *   Найти `AlchemyItemProperty` для `itemId` с `property_name = 'cooldown'`.
        *   Создать/обновить запись в `user_item_cooldowns`.
    5.  **Возврат результата**.

*   **Фоновая задача / Обработка истечения эффектов (концептуально для будущего)**:
    *   Механизм для периодической проверки и удаления истекших эффектов из `active_player_effects`.

## 5. Mermaid Диаграмма Плана

```mermaid
graph TD
    A[Задача: Реализовать использование Consumable Items] --> B{Анализ и Уточнение};
    B --> C[Пользовательские Подтверждения];
    C --> D{Финальный План};

    D --> F1[1. SQL и Модели Sequelize];
    F1 --> F1a[AlchemyItem (обновить)];
    F1 --> F1b[AlchemyItemEffect (новая)];
    F1 --> F1c[AlchemyItemProperty (новая)];
    F1 --> F1d[AlchemyItemStat (новая)];
    F1 --> F1e[CultivationProgress (обновить)];
    F1 --> F1f[UserItemCooldowns (новая табл. и модель)];
    F1 --> F1g[ActivePlayerEffects (новая табл. и модель)];
    F1 --> F1h[Обновить models/index.js];

    D --> F2[2. Стандартизация description в alchemy_item_effects];
    F2 --> F2a[Определить четкий формат];
    F2 --> F2b[Примечание: Потребуется миграция данных];

    D --> F3[3. Парсер для description];
    F3 --> F3a[Утилита/Метод для парсинга];

    D --> F4[4. Реализация в AlchemyService];
    F4 --> F4a[Метод: useConsumableItem(userId, itemId)];
    F4a --> Sub1[Проверки (наличие, инвентарь, cooldown)];
    F4a --> Sub2[Потребление предмета];
    F4a --> Sub3[Применение эффектов];
    Sub3 --> Sub3a[Парсинг description];
    Sub3 --> Sub3b[Логика по типу/действию эффекта];
    Sub3b --> Sub3b1[Мгновенные -> CultivationProgress/CharacterStats];
    Sub3b --> Sub3b2[Временные -> ActivePlayerEffects];
    F4a --> Sub4[Управление Cooldown -> UserItemCooldowns];
    F4a --> Sub5[Возврат результата];

    D --> F5[5. Концепт: Фоновая обработка ActivePlayerEffects];