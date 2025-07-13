# Реорганизация системы локаций и врагов

## Обзор задачи

Необходимо модифицировать систему карты, создав 7 локаций с улучшенной системой распределения врагов. Первая локация - "Долина Начала".

## Анализ текущей структуры

### Фронтенд (MapTab.js)
- Использует hardcoded массив `defaultLocations` с 10 локациями
- Локации имеют поля: id, name, type, x, y, description, resources
- Отсутствует поле `energyCost`
- Нет связи с базой данных для локаций

### База данных (sql/03_enemies.sql)
- Есть таблица `enemy_spawns` с полем `location_id`
- Отсутствует таблица `locations`
- Враги привязаны к локациям через строковые ID

### Модели
- Класс `Location` (src/models/location.js) - богатая модель с эффектами
- Модель `EnemySpawn` (src/models/enemy-spawn.js) - Sequelize модель

## Проектирование 7 новых локаций

### 1. Долина Начала (starting_valley)
- **Тип**: forest
- **Описание**: Мирная долина, где начинают свой путь молодые культиваторы. Здесь растут базовые духовные травы и обитают слабые духовные звери.
- **energyCost**: 0 (стартовая локация)
- **Фон**: /assets/images/map/1.png
- **Враги**: training_dummy, weak_spirit_beast
- **Особенности**: Безопасная зона для новичков

### 2. Туманные Болота (misty_swamps)
- **Тип**: swamp
- **Описание**: Опасные болота, окутанные вечным туманом. Здесь скрываются ядовитые существа и блуждающие души.
- **energyCost**: 15
- **Фон**: /assets/images/map/2.png
- **Враги**: swamp_wraith, poison_toad, mist_spirit
- **Особенности**: Повышенная опасность в тумане

### 3. Кристальные Пещеры (crystal_caves)
- **Тип**: cave
- **Описание**: Подземные пещеры, наполненные магическими кристаллами. Источник земной энергии и редких минералов.
- **energyCost**: 25
- **Фон**: /assets/images/map/3.png
- **Враги**: crystal_golem, cave_bat, earth_elemental
- **Особенности**: Бонус к земной культивации

### 4. Пылающие Пустоши (burning_wastelands)
- **Тип**: desert
- **Описание**: Выжженная пустыня с активными вулканами. Место силы для практиков огненного пути.
- **energyCost**: 35
- **Фон**: /assets/images/map/4.png
- **Враги**: fire_salamander, lava_beast, desert_scorpion
- **Особенности**: Бонус к огненной культивации, дебафф к водной

### 5. Ледяные Вершины (frozen_peaks)
- **Тип**: mountain
- **Описание**: Заснеженные горные пики с ледяными ветрами. Испытание холодом для сильных культиваторов.
- **energyCost**: 45
- **Фон**: /assets/images/map/5.png
- **Враги**: ice_wolf, frost_giant, blizzard_spirit
- **Особенности**: Бонус к ледяной культивации, дебафф к огненной

### 6. Древний Лес (ancient_forest)
- **Тип**: forest
- **Описание**: Древний лес с могущественными духами природы. Место силы для друидов и натуралистов.
- **energyCost**: 55
- **Фон**: /assets/images/map/6.png
- **Враги**: treant_guardian, forest_drake, nature_spirit
- **Особенности**: Бонус к природной культивации и сбору трав

### 7. Небесная Обсерватория (celestial_observatory)
- **Тип**: tower
- **Описание**: Мистическая башня, достигающая небес. Место изучения звездной магии и высших искусств.
- **energyCost**: 70
- **Фон**: /assets/images/map/7.png
- **Враги**: star_guardian, void_wraith, celestial_construct
- **Особенности**: Бонус к астральной культивации, доступ к редким техникам

## SQL модификации для sql/03_enemies.sql

### Добавление таблицы locations

```sql
-- Таблица локаций
CREATE TABLE locations (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    energy_cost INTEGER DEFAULT 0,
    background_image VARCHAR(200),
    enemies JSON,
    coordinates JSON,
    effects JSON,
    requirements JSON
);
```

### Заполнение таблицы locations

```sql
INSERT INTO locations (id, name, description, type, energy_cost, background_image, enemies, coordinates, effects, requirements) VALUES
('starting_valley', 'Долина Начала', 'Мирная долина, где начинают свой путь молодые культиваторы. Здесь растут базовые духовные травы и обитают слабые духовные звери.', 'forest', 0, '/assets/images/map/1.png', '["training_dummy", "weak_spirit_beast"]', '{"x": 1, "y": 1}', '[]', 'null'),
('misty_swamps', 'Туманные Болота', 'Опасные болота, окутанные вечным туманом. Здесь скрываются ядовитые существа и блуждающие души.', 'swamp', 15, '/assets/images/map/2.png', '["swamp_wraith", "poison_toad", "mist_spirit"]', '{"x": 2, "y": 1}', '[{"type": "fog_bonus", "modifier": 20}]', 'null'),
('crystal_caves', 'Кристальные Пещеры', 'Подземные пещеры, наполненные магическими кристаллами. Источник земной энергии и редких минералов.', 'cave', 25, '/assets/images/map/3.png', '["crystal_golem", "cave_bat", "earth_elemental"]', '{"x": 3, "y": 1}', '[{"type": "earth_cultivation_bonus", "modifier": 15}]', '{"cultivation": {"level": 5}}'),
('burning_wastelands', 'Пылающие Пустоши', 'Выжженная пустыня с активными вулканами. Место силы для практиков огненного пути.', 'desert', 35, '/assets/images/map/4.png', '["fire_salamander", "lava_beast", "desert_scorpion"]', '{"x": 4, "y": 1}', '[{"type": "fire_cultivation_bonus", "modifier": 20}, {"type": "water_cultivation_penalty", "modifier": -10}]', '{"cultivation": {"level": 10}}'),
('frozen_peaks', 'Ледяные Вершины', 'Заснеженные горные пики с ледяными ветрами. Испытание холодом для сильных культиваторов.', 'mountain', 45, '/assets/images/map/5.png', '["ice_wolf", "frost_giant", "blizzard_spirit"]', '{"x": 5, "y": 1}', '[{"type": "ice_cultivation_bonus", "modifier": 20}, {"type": "fire_cultivation_penalty", "modifier": -15}]', '{"cultivation": {"level": 15}}'),
('ancient_forest', 'Древний Лес', 'Древний лес с могущественными духами природы. Место силы для друидов и натуралистов.', 'forest', 55, '/assets/images/map/6.png', '["treant_guardian", "forest_drake", "nature_spirit"]', '{"x": 6, "y": 1}', '[{"type": "nature_cultivation_bonus", "modifier": 25}, {"type": "herb_gathering_bonus", "modifier": 30}]', '{"cultivation": {"level": 20}}'),
('celestial_observatory', 'Небесная Обсерватория', 'Мистическая башня, достигающая небес. Место изучения звездной магии и высших искусств.', 'tower', 70, '/assets/images/map/7.png', '["star_guardian", "void_wraith", "celestial_construct"]', '{"x": 7, "y": 1}', '[{"type": "astral_cultivation_bonus", "modifier": 30}, {"type": "technique_learning_bonus", "modifier": 20}]', '{"cultivation": {"level": 25}}');
```

### Добавление новых врагов

```sql
-- Новые враги для разнообразия
INSERT INTO enemies (id, name, icon, description, level, category, experience) VALUES
('swamp_wraith', 'Болотный призрак', '👻', 'Мстительный дух, утонувший в болоте. Использует ядовитые атаки.', 4, 'undead', 35),
('poison_toad', 'Ядовитая жаба', '🐸', 'Огромная жаба с ядовитой кожей. Плюется кислотой.', 3, 'beast', 25),
('mist_spirit', 'Дух тумана', '🌫️', 'Элементальное существо из тумана. Может становиться неосязаемым.', 5, 'elemental', 45),
('crystal_golem', 'Кристальный голем', '💎', 'Конструкт из магических кристаллов. Очень прочный.', 8, 'construct', 80),
('cave_bat', 'Пещерная летучая мышь', '🦇', 'Гигантская летучая мышь. Атакует ультразвуком.', 4, 'beast', 30),
('earth_elemental', 'Земляной элементаль', '🗿', 'Существо из камня и земли. Медленный, но мощный.', 7, 'elemental', 70),
('fire_salamander', 'Огненная саламандра', '🦎', 'Ящерица, пылающая внутренним огнем. Иммунна к огню.', 9, 'elemental', 90),
('lava_beast', 'Лавовый зверь', '🌋', 'Чудовище из расплавленной лавы. Крайне опасно.', 12, 'elemental', 120),
('desert_scorpion', 'Пустынный скорпион', '🦂', 'Огромный скорпион с ядовитым жалом.', 6, 'beast', 60),
('ice_wolf', 'Ледяной волк', '🐺', 'Волк из вечных льдов. Дышит морозом.', 10, 'beast', 100),
('frost_giant', 'Ледяной великан', '🧊', 'Гигант из льда и снега. Владеет ледяной магией.', 15, 'giant', 150),
('blizzard_spirit', 'Дух метели', '❄️', 'Элементаль зимы. Создает снежные бури.', 11, 'elemental', 110),
('treant_guardian', 'Страж-энт', '🌳', 'Древний страж леса. Защищает природу.', 13, 'plant', 130),
('forest_drake', 'Лесной дракончик', '🐉', 'Молодой дракон природы. Использует растительную магию.', 14, 'dragon', 140),
('nature_spirit', 'Дух природы', '🍃', 'Воплощение силы леса. Лечит союзников.', 12, 'elemental', 120),
('star_guardian', 'Звездный страж', '⭐', 'Хранитель звездных тайн. Использует астральную магию.', 18, 'celestial', 180),
('void_wraith', 'Призрак пустоты', '🌌', 'Существо из межзвездной тьмы. Поглощает энергию.', 16, 'void', 160),
('celestial_construct', 'Небесный конструкт', '🔮', 'Магический автомат обсерватории. Стреляет звездной энергией.', 17, 'construct', 170);
```

### Характеристики новых врагов

```sql
INSERT INTO enemy_stats (enemy_id, health, energy, physical_defense, spiritual_defense, accuracy, evasion) VALUES
('swamp_wraith', 90, 60, 8, 20, 70, 45),
('poison_toad', 110, 40, 20, 10, 65, 25),
('mist_spirit', 80, 80, 5, 25, 80, 60),
('crystal_golem', 200, 50, 35, 15, 60, 10),
('cave_bat', 70, 30, 10, 8, 85, 70),
('earth_elemental', 180, 70, 30, 20, 65, 20),
('fire_salamander', 160, 90, 20, 25, 75, 40),
('lava_beast', 250, 100, 25, 30, 70, 25),
('desert_scorpion', 130, 60, 25, 15, 80, 50),
('ice_wolf', 150, 80, 18, 22, 85, 55),
('frost_giant', 300, 120, 40, 35, 65, 15),
('blizzard_spirit', 170, 110, 15, 40, 80, 50),
('treant_guardian', 280, 100, 35, 30, 60, 20),
('forest_drake', 220, 130, 25, 35, 85, 45),
('nature_spirit', 160, 120, 20, 45, 75, 40),
('star_guardian', 250, 150, 30, 50, 90, 60),
('void_wraith', 200, 140, 20, 45, 85, 70),
('celestial_construct', 230, 130, 35, 40, 80, 35);
```

### Обновление enemy_spawns

```sql
-- Очистка старых записей
DELETE FROM enemy_spawns;

-- Новые записи для 7 локаций
INSERT INTO enemy_spawns (location_id, enemy_id, min_level, max_level, weight, time_of_day, weather_condition) VALUES
-- Долина Начала
('starting_valley', 'training_dummy', 1, 2, 60, NULL, NULL),
('starting_valley', 'weak_spirit_beast', 2, 4, 40, NULL, NULL),

-- Туманные Болота
('misty_swamps', 'swamp_wraith', 4, 6, 40, 'ночь', 'Туман'),
('misty_swamps', 'poison_toad', 3, 5, 50, NULL, NULL),
('misty_swamps', 'mist_spirit', 5, 7, 30, NULL, 'Туман'),
('misty_swamps', 'weak_spirit_beast', 3, 4, 20, NULL, NULL),

-- Кристальные Пещеры
('crystal_caves', 'crystal_golem', 8, 10, 40, NULL, NULL),
('crystal_caves', 'cave_bat', 4, 6, 50, 'ночь', NULL),
('crystal_caves', 'earth_elemental', 7, 9, 30, NULL, NULL),
('crystal_caves', 'mountain_bandit', 5, 7, 20, NULL, NULL),

-- Пылающие Пустоши
('burning_wastelands', 'fire_salamander', 9, 11, 40, 'день', 'Ясно'),
('burning_wastelands', 'lava_beast', 12, 14, 25, NULL, NULL),
('burning_wastelands', 'desert_scorpion', 6, 8, 45, NULL, NULL),
('burning_wastelands', 'lightning_spirit', 8, 10, 20, NULL, 'Гроза'),

-- Ледяные Вершины
('frozen_peaks', 'ice_wolf', 10, 12, 50, NULL, 'Снег'),
('frozen_peaks', 'frost_giant', 15, 17, 20, NULL, 'Снег'),
('frozen_peaks', 'blizzard_spirit', 11, 13, 30, NULL, 'Снег'),
('frozen_peaks', 'mountain_bandit', 8, 10, 25, NULL, NULL),

-- Древний Лес
('ancient_forest', 'treant_guardian', 13, 15, 30, NULL, NULL),
('ancient_forest', 'forest_drake', 14, 16, 25, NULL, NULL),
('ancient_forest', 'nature_spirit', 12, 14, 35, 'рассвет', NULL),
('ancient_forest', 'weak_spirit_beast', 8, 10, 40, NULL, NULL),

-- Небесная Обсерватория
('celestial_observatory', 'star_guardian', 18, 20, 30, 'ночь', 'Ясно'),
('celestial_observatory', 'void_wraith', 16, 18, 35, 'ночь', NULL),
('celestial_observatory', 'celestial_construct', 17, 19, 25, NULL, NULL),
('celestial_observatory', 'ancient_guardian', 15, 17, 20, NULL, NULL);
```

## API модификации

### Создание location-routes.js

Необходимо создать новый файл `src/server/routes/location-routes.js` с маршрутами:

- `GET /api/locations` - получить все локации
- `GET /api/locations/:id` - получить локацию по ID
- `GET /api/locations/:id/enemies` - получить врагов локации
- `POST /api/locations` - создать локацию (админ)
- `PUT /api/locations/:id` - обновить локацию (админ)
- `DELETE /api/locations/:id` - удалить локацию (админ)

### Создание location-service.js

Сервис для работы с локациями в базе данных.

### Создание location-api.js

Клиентский API для работы с локациями.

## Модификации фронтенда

### MapTab.js изменения

1. Заменить `defaultLocations` на загрузку из API
2. Добавить поддержку `energyCost`
3. Добавить фоновые изображения локаций
4. Обновить логику отображения врагов

### Новые компоненты

1. `LocationCard` - карточка локации с детальной информацией
2. `EnemyList` - список врагов локации
3. `LocationRequirements` - отображение требований для доступа

## Изображения локаций

Необходимо создать 7 изображений фонов:

1. `public/assets/images/map/1.png` - Долина Начала (зеленая долина)
2. `public/assets/images/map/2.png` - Туманные Болота (темные болота в тумане)
3. `public/assets/images/map/3.png` - Кристальные Пещеры (пещера с кристаллами)
4. `public/assets/images/map/4.png` - Пылающие Пустоши (вулканическая пустыня)
5. `public/assets/images/map/5.png` - Ледяные Вершины (заснеженные горы)
6. `public/assets/images/map/6.png` - Древний Лес (густой древний лес)
7. `public/assets/images/map/7.png` - Небесная Обсерватория (башня в облаках)

## План реализации

1. **Модификация SQL** - добавить таблицу locations и новых врагов
2. **Создание API** - location-routes.js, location-service.js, location-api.js
3. **Обновление моделей** - создать Sequelize модель для Location
4. **Модификация фронтенда** - обновить MapTab.js и создать новые компоненты
5. **Добавление изображений** - создать фоны для локаций
6. **Тестирование** - проверить работу новой системы

## Преимущества новой системы

1. **Гибкость** - локации хранятся в базе данных
2. **Масштабируемость** - легко добавлять новые локации
3. **Баланс** - energyCost контролирует прогрессию
4. **Иммерсивность** - уникальные фоны и описания
5. **Геймплей** - разнообразные враги в каждой локации