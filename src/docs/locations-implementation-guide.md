# Руководство по реализации системы локаций

## Пошаговая инструкция для разработчиков

### Шаг 1: Модификация базы данных

#### 1.1 Добавление в sql/03_enemies.sql

Добавить в конец файла `sql/03_enemies.sql`:

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

-- Заполнение таблицы locations
INSERT INTO locations (id, name, description, type, energy_cost, background_image, enemies, coordinates, effects, requirements) VALUES
('starting_valley', 'Долина Начала', 'Мирная долина, где начинают свой путь молодые культиваторы. Здесь растут базовые духовные травы и обитают слабые духовные звери.', 'forest', 0, '/assets/images/map/1.png', '["training_dummy", "weak_spirit_beast"]', '{"x": 1, "y": 1}', '[]', 'null'),
('misty_swamps', 'Туманные Болота', 'Опасные болота, окутанные вечным туманом. Здесь скрываются ядовитые существа и блуждающие души.', 'swamp', 15, '/assets/images/map/2.png', '["swamp_wraith", "poison_toad", "mist_spirit"]', '{"x": 2, "y": 1}', '[{"type": "fog_bonus", "modifier": 20}]', 'null'),
('crystal_caves', 'Кристальные Пещеры', 'Подземные пещеры, наполненные магическими кристаллами. Источник земной энергии и редких минералов.', 'cave', 25, '/assets/images/map/3.png', '["crystal_golem", "cave_bat", "earth_elemental"]', '{"x": 3, "y": 1}', '[{"type": "earth_cultivation_bonus", "modifier": 15}]', '{"cultivation": {"level": 5}}'),
('burning_wastelands', 'Пылающие Пустоши', 'Выжженная пустыня с активными вулканами. Место силы для практиков огненного пути.', 'desert', 35, '/assets/images/map/4.png', '["fire_salamander", "lava_beast", "desert_scorpion"]', '{"x": 4, "y": 1}', '[{"type": "fire_cultivation_bonus", "modifier": 20}, {"type": "water_cultivation_penalty", "modifier": -10}]', '{"cultivation": {"level": 10}}'),
('frozen_peaks', 'Ледяные Вершины', 'Заснеженные горные пики с ледяными ветрами. Испытание холодом для сильных культиваторов.', 'mountain', 45, '/assets/images/map/5.png', '["ice_wolf", "frost_giant", "blizzard_spirit"]', '{"x": 5, "y": 1}', '[{"type": "ice_cultivation_bonus", "modifier": 20}, {"type": "fire_cultivation_penalty", "modifier": -15}]', '{"cultivation": {"level": 15}}'),
('ancient_forest', 'Древний Лес', 'Древний лес с могущественными духами природы. Место силы для друидов и натуралистов.', 'forest', 55, '/assets/images/map/6.png', '["treant_guardian", "forest_drake", "nature_spirit"]', '{"x": 6, "y": 1}', '[{"type": "nature_cultivation_bonus", "modifier": 25}, {"type": "herb_gathering_bonus", "modifier": 30}]', '{"cultivation": {"level": 20}}'),
('celestial_observatory', 'Небесная Обсерватория', 'Мистическая башня, достигающая небес. Место изучения звездной магии и высших искусств.', 'tower', 70, '/assets/images/map/7.png', '["star_guardian", "void_wraith", "celestial_construct"]', '{"x": 7, "y": 1}', '[{"type": "astral_cultivation_bonus", "modifier": 30}, {"type": "technique_learning_bonus", "modifier": 20}]', '{"cultivation": {"level": 25}}');

-- Новые враги
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

-- Характеристики новых врагов
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

-- Обновление enemy_spawns
DELETE FROM enemy_spawns;

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

### Шаг 2: Создание Sequelize модели

#### 2.1 Создать файл src/models/location-model.js

```javascript
'use strict';

const { Model, DataTypes } = require('../services/database');
const { unifiedDatabase } = require('../services/database-connection-manager');

let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await unifiedDatabase.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class LocationModel extends Model {
  static associate(models) {
    // Связь с enemy_spawns
    this.hasMany(models.EnemySpawn, {
      foreignKey: 'locationId',
      as: 'spawns'
    });
  }
}

LocationModel.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    energyCost: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'energy_cost'
    },
    backgroundImage: {
      type: DataTypes.STRING(200),
      field: 'background_image'
    },
    enemies: {
      type: DataTypes.JSON
    },
    coordinates: {
      type: DataTypes.JSON
    },
    effects: {
      type: DataTypes.JSON
    },
    requirements: {
      type: DataTypes.JSON
    }
  }, {
    sequelize,
    modelName: 'LocationModel',
    tableName: 'locations',
    timestamps: false,
    underscored: true
  });
};

// Инициализация модели
(async () => {
  try {
    await LocationModel.init();
    console.log('LocationModel инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации LocationModel:', error);
  }
})();

module.exports = LocationModel;
```

### Шаг 3: Создание сервиса для локаций

#### 3.1 Создать файл src/services/location-service.js

```javascript
/**
 * Сервис для работы с локациями
 */

const connectionProvider = require('../utils/connection-provider');
const { initializeModels, waitForInitialization } = require('../models/initializeModels');

let locationsCache = [];

/**
 * Получает все локации из базы данных
 */
exports.getAllLocations = async function() {
  try {
    await waitForInitialization();
    const { db } = await connectionProvider.getSequelizeInstance();
    
    const LocationModel = db.model('LocationModel');
    const EnemySpawn = db.model('EnemySpawn');
    
    const locations = await LocationModel.findAll({
      include: [
        { model: EnemySpawn, as: 'spawns' }
      ]
    });
    
    const formattedLocations = locations.map(location => formatLocation(location));
    locationsCache = formattedLocations;
    
    return formattedLocations;
  } catch (error) {
    console.error('Ошибка при получении локаций:', error);
    return locationsCache;
  }
};

/**
 * Получает локацию по ID
 */
exports.getLocationById = async function(id) {
  try {
    await waitForInitialization();
    const { db } = await connectionProvider.getSequelizeInstance();
    
    const LocationModel = db.model('LocationModel');
    const EnemySpawn = db.model('EnemySpawn');
    
    const location = await LocationModel.findByPk(id, {
      include: [
        { model: EnemySpawn, as: 'spawns' }
      ]
    });
    
    if (!location) return null;
    
    return formatLocation(location);
  } catch (error) {
    console.error(`Ошибка при получении локации ${id}:`, error);
    return locationsCache.find(loc => loc.id === id) || null;
  }
};

/**
 * Получает врагов локации
 */
exports.getLocationEnemies = async function(locationId) {
  try {
    await waitForInitialization();
    const { db } = await connectionProvider.getSequelizeInstance();
    
    const EnemySpawn = db.model('EnemySpawn');
    const Enemy = db.model('Enemy');
    
    const spawns = await EnemySpawn.findAll({
      where: { locationId },
      include: [
        { model: Enemy, as: 'enemy' }
      ]
    });
    
    return spawns.map(spawn => ({
      enemy: spawn.enemy,
      minLevel: spawn.minLevel,
      maxLevel: spawn.maxLevel,
      weight: spawn.weight,
      timeOfDay: spawn.timeOfDay,
      weatherCondition: spawn.weatherCondition
    }));
  } catch (error) {
    console.error(`Ошибка при получении врагов локации ${locationId}:`, error);
    return [];
  }
};

/**
 * Форматирует локацию для клиента
 */
function formatLocation(location) {
  const plain = location.get ? location.get({ plain: true }) : location;
  
  return {
    id: plain.id,
    name: plain.name,
    description: plain.description,
    type: plain.type,
    energyCost: plain.energyCost || 0,
    backgroundImage: plain.backgroundImage,
    enemies: plain.enemies || [],
    coordinates: plain.coordinates || { x: 0, y: 0 },
    effects: plain.effects || [],
    requirements: plain.requirements || null,
    spawns: plain.spawns || []
  };
}
```

### Шаг 4: Создание API маршрутов

#### 4.1 Создать файл src/server/routes/location-routes.js

```javascript
/**
 * Маршруты API для работы с локациями
 */

const express = require('express');
const router = express.Router();
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const LocationService = require('../../services/location-service');

/**
 * @route GET /api/locations
 * @desc Получить все локации
 * @access Public
 */
router.get('/api/locations', async (req, res) => {
  try {
    const locations = await LocationService.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error('Ошибка при получении локаций:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении локаций' });
  }
});

/**
 * @route GET /api/locations/:id
 * @desc Получить локацию по ID
 * @access Public
 */
router.get('/api/locations/:id', async (req, res) => {
  try {
    const location = await LocationService.getLocationById(req.params.id);
    
    if (!location) {
      return res.status(404).json({ message: 'Локация не найдена' });
    }
    
    res.json(location);
  } catch (error) {
    console.error(`Ошибка при получении локации ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении локации' });
  }
});

/**
 * @route GET /api/locations/:id/enemies
 * @desc Получить врагов локации
 * @access Public
 */
router.get('/api/locations/:id/enemies', async (req, res) => {
  try {
    const enemies = await LocationService.getLocationEnemies(req.params.id);
    res.json(enemies);
  } catch (error) {
    console.error(`Ошибка при получении врагов локации ${req.params.id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении врагов локации' });
  }
});

module.exports = router;
```

### Шаг 5: Создание клиентского API

#### 5.1 Создать файл src/services/location-api.js

```javascript
/**
 * API для взаимодействия с локациями через HTTP
 */

const BASE_URL = typeof window !== 'undefined' ?
  (window.location.origin || 'http://localhost:3001') :
  'http://localhost:3001';

const locationsCache = new Map();

// Определяем fetch функцию
let fetchFn;
if (typeof fetch !== 'undefined') {
  fetchFn = fetch;
} else {
  fetchFn = async (url, options = {}) => {
    console.log(`[STUB FETCH] ${options.method || 'GET'} ${url}`);
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: [] })
    };
  };
}

const api = {
  async get(url) {
    try {
      const response = await fetchFn(`${BASE_URL}${url}`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (GET ${url}):`, error);
      return [];
    }
  }
};

/**
 * Получает все локации
 */
async function getAllLocations() {
  const cacheKey = 'all_locations';
  
  if (locationsCache.has(cacheKey)) {
    return locationsCache.get(cacheKey);
  }
  
  try {
    const locations = await api.get('/api/locations');
    locationsCache.set(cacheKey, locations);
    return locations;
  } catch (error) {
    console.error('Ошибка при получении локаций:', error);
    return [];
  }
}

/**
 * Получает локацию по ID
 */
async function getLocationById(id) {
  const cacheKey = `location_${id}`;
  
  if (locationsCache.has(cacheKey)) {
    return locationsCache.get(cacheKey);
  }
  
  try {
    const location = await api.get(`/api/locations/${id}`);
    locationsCache.set(cacheKey, location);
    return location;
  } catch (error) {
    console.error(`Ошибка при получении локации ${id}:`, error);
    return null;
  }
}

/**
 * Получает врагов локации
 */
async function getLocationEnemies(locationId) {
  try {
    return await api.get(`/api/locations/${locationId}/enemies`);
  } catch (error) {
    console.error(`Ошибка при получении врагов локации ${locationId}:`, error);
    return [];
  }
}

module.exports = {
  getAllLocations,
  getLocationById,
  getLocationEnemies
};
```

### Шаг 6: Обновление главного роутера

#### 6.1 Обновить src/server/routes/index.js

Добавить импорт и использование location-routes:

```javascript
// Добавить в импорты
const locationRoutes = require('./location-routes');

// Добавить в использование маршрутов
app.use('/', locationRoutes);
```

### Шаг 7: Модификация MapTab.js

#### 7.1 Основные изменения в src/components/tabs/MapTab.js

```javascript
// Добавить импорт
import { getAllLocations } from '../../services/location-api';

// Заменить defaultLocations на состояние
const [locations, setLocations] = useState([]);
const [locationsLoading, setLocationsLoading] = useState(true);

// Добавить useEffect для загрузки локаций
useEffect(() => {
  const loadLocations = async () => {
    try {
      setLocationsLoading(true);
      const fetchedLocations = await getAllLocations();
      setLocations(fetchedLocations);
    } catch (error) {
      console.error('Ошибка загрузки локаций:', error);
      // Fallback к defaultLocations если нужно
    } finally {
      setLocationsLoading(false);
    }
  };
  
  loadLocations();
}, []);

// Обновить логику путешествия с учетом energyCost
const handleTravel = () => {
  if (!selectedLocation) return;
  
  const energyCost = selectedLocation.energyCost || 0;
  
  if ((cultivation.energy || 0) < energyCost) {
    if (actions.addNotification) {
      actions.addNotification({
        message: `Недостаточно духовной энергии для путешествия (требуется: ${energyCost})`,
        type: 'error'
      });
    }
    return;
  }
  
  // Остальная логика...
};
```

### Шаг 8: Создание изображений

Создать 7 изображений в папке `public/assets/images/map/`:

1. `1.png` - Долина Начала (зеленая долина с цветами)
2. `2.png` - Туманные Болота (темные болота в тумане)
3. `3.png` - Кристальные Пещеры (пещера с светящимися кристаллами)
4. `4.png` - Пылающие Пустоши (вулканическая пустыня с лавой)
5. `5.png` - Ледяные Вершины (заснеженные горные пики)
6. `6.png` - Древний Лес (густой лес с древними деревьями)
7. `7.png` - Небесная Обсерватория (башня в облаках со звездами)

### Шаг 9: Тестирование

1. Запустить SQL скрипт для создания таблиц
2. Перезапустить сервер
3. Проверить API endpoints:
   - `GET /api/locations`
   - `GET /api/locations/starting_valley`
   - `GET /api/locations/starting_valley/enemies`
4. Проверить работу фронтенда

### Шаг 10: Дополнительные улучшения

#### 10.1 Добавление фоновых изображений в MapTab.js

```javascript
// Добавить стили для фонового изображения
const MapArea = styled.div`
  // ... существующие стили
  
  ${props => props.backgroundImage && css`
    background-image: url(${props.backgroundImage});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  `}
`;

// Использовать в компоненте
<MapArea 
  daytimePeriod={daytimePeriod} 
  season={currentSeason}
  backgroundImage={selectedLocation?.backgroundImage}
>
```

#### 10.2 Отображение energyCost

```javascript
// В LocationInfo добавить отображение стоимости энергии
{selectedLocation && (
  <div>
    <p>Стоимость путешествия: {selectedLocation.energyCost} энергии</p>
  </div>
)}
```

## Заключение

После выполнения всех шагов система локаций будет полностью интегрирована с базой данных, будет поддерживать energyCost, фоновые изображения и разнообразных врагов в каждой локации.