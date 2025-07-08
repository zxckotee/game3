// Начальное состояние игры
const initialState = {
  // Данные авторизации
  auth: {
    user: null,
    isAuthenticated: false,
    token: null
  },
  // Данные игрока
  player: {
    id: null,
    name: '',
    avatar: '',
    gender: '',
    background: '',
    region: '',
    
    // Характеристики
    stats: {
      strength: 10, // Сила
      intellect: 10, // Дух
      agility: 10, // Ловкость
      health: 100, // Здоровье - исправлено с 10 на 100 для согласованности
      maxHealth: 100, // Максимальное здоровье
      energy: 100, // Текущая энергия
      maxEnergy: 100, // Максимальная энергия
      unassignedPoints: 0, // Нераспределенные очки характеристик
    },
    
    // Вторичные характеристики
    secondaryStats: {
      physicalDefense: 0,
      spiritualDefense: 0,
      attackSpeed: 0,
      criticalChance: 0,
      movementSpeed: 0,
      luck: 0,
    },
    
    // Система культивации
    cultivation: {
      stage: 'Закалка тела', // Текущая ступень
      level: 1, // Уровень в текущей ступени (1-9)
      experience: 0, // Текущий опыт
      experienceToNextLevel: 100, // Опыт для следующего уровня
      energy: 100, // Текущая духовная энергия
      maxEnergy: 100, // Максимальная духовная энергия
      bottleneckProgress: 0, // Прогресс "бутылочного горлышка"
      requiredBottleneckProgress: 100, // Необходимый прогресс для преодоления "бутылочного горлышка"
      techniques: [], // Изученные техники
    },
    
    // Инвентарь
    inventory: {
      items: [], // Предметы в инвентаре
      equipment: {}, // Экипированные предметы
      currency: {
        copper: 0, // Медные монеты
        silver: 0, // Серебряные монеты
        gold: 0, // Золотые монеты
        spiritStones: 0, // Духовные камни (премиум валюта)
      },
    },
    
    // Социальные данные
    social: {
      sect: null, // Принадлежность к секте
      reputationLegacy: {}, // Устаревшие данные о репутации (для совместимости)
      friends: [], // Список друзей
      relationships: [], // Отношения с NPC (массив, а не объект!)
    },
    
    // Прогресс
    progress: {
      quests: {
        active: [],
        available: [],
        completed: []
      },
      discoveries: {}, // Открытые локации
      achievements: {}, // Достижения
    },
    techniques: [],
    activeTechniques: {}, // Активные эффекты от техник с таймерами
    // Примечание: основные параметры здоровья и энергии уже перенесены в stats выше
    statusEffects: {},
    
    // Духовные питомцы
    spiritPets: {
      pets: [], // Список питомцев игрока
      activePetId: null, // ID активного питомца
    },
    
    // История боев
    combatHistory: [] // Сохраняет результаты всех завершенных боев
  },
  
  // Состояние игрового мира
  world: {
    currentLocation: null, // Текущая локация
    time: {
      day: 1,
      hour: 6,
      minute: 0,
      season: 'spring',
      year: 1,
    },
    generatedEnemies: {}, // Кэш сгенерированных врагов
  },
  
  // Состояние интерфейса
  ui: {
    currentScreen: 'world', // Текущий экран (world, inventory, character, etc.)
    notifications: [], // Уведомления
    dialogs: [], // Активные диалоги
    settings: {
      soundVolume: 0.5,
      musicVolume: 0.5,
      graphicsQuality: 'medium',
    },
  },
  
  achievements: {
    completed: [],
    points: 0
  },
  
  combat: {
    inCombat: false,
    enemy: null,
    log: [],
    turn: 1,
    
    // Расширенное состояние боя для сохранения прогресса
    playerCombatState: {
      stats: null,
      effects: []
    },
    
    enemyCombatState: null,
    
    isPlayerTurn: true,
    combatStats: {
      player: { damageDealt: 0, techniquesUsed: 0, criticalHits: 0, dodges: 0 },
      enemy: { damageDealt: 0, techniquesUsed: 0, criticalHits: 0, dodges: 0 }
    },
    
    startTime: null,
    
    // История боев
    lastCombatResult: null
  },
  
  // Состояние сект
  sect: {
    sect: null, // Информация о секте
    loading: false,
    error: null,
    userRank: null, // Ранг пользователя в секте
    privileges: [], // Привилегии пользователя в секте
    benefits: [], // Бонусы от секты в виде массива эффектов
    selectedMember: null // Выбранный член секты для взаимодействия
  },
  
  // Состояние рынка и торговли
  market: {
    playerItems: [], // Предметы, выставленные игроком на продажу
    marketItems: [], // Предметы других игроков на рынке
    merchantReputation: {}, // Репутация игрока у разных торговцев
    lastUpdated: null, // Время последнего обновления рынка
  },
  
  // Система репутации
  reputation: {
    // Данные о репутации
    data: {
      cities: [],
      factions: [],
      global: null
    },
    // Доступные возможности
    features: [],
    // Уведомления
    notifications: [],
    // Статус загрузки
    loading: false,
    // Флаг изменения репутации
    changing: false,
    // Ошибка
    error: null
  },
  
  isInitialized: false
};

export default initialState;
