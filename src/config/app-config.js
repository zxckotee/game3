/**
 * Конфигурация приложения
 */
const config = {
  // Общие настройки
  common: {
    appName: 'Путь к Бессмертию',
    version: '1.0.0',
    debugMode: process.env.NODE_ENV !== 'production',
    // Уровень логирования:
    // 0: ERROR - только ошибки
    // 1: WARN  - ошибки и предупреждения
    // 2: INFO  - обычная информация (по умолчанию в режиме разработки)
    // 3: DEBUG - подробная информация для отладки
    // 4: VERBOSE - очень подробная информация (много логов)
    logLevel: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL, 10) : undefined
  },
  
  // Настройки для работы с базой данных
  database: {
    useDatabase: process.env.USE_DATABASE === 'true' || false, // Изменено на false, чтобы использовать файлы
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/immortal_path',
    logging: process.env.NODE_ENV !== 'production'
  },
  
  // Настройки торговцев
  merchants: {
    // Использовать данные из файлов (true) или базу данных (false)
    useFileData: process.env.USE_MERCHANT_FILES === 'true' || true, // Изменено на true
    
    // Обновление инвентаря торговцев (в часах)
    inventoryRefreshRate: 24,
    
    // Множитель цены для продажи предметов торговцам (0.3-0.7)
    sellPriceMultiplier: 0.5
  },
  
  // Настройки системы экипировки
  equipment: {
    // Максимальное количество аксессуаров и артефактов
    maxAccessories: 2,
    maxArtifacts: 2,
    
    // Множитель для бонусов от сетов экипировки
    setsBonusMultiplier: 1.2
  },
  
  // Настройки для системы культивации
  cultivation: {
    // Базовый опыт, получаемый за медитацию
    baseMeditationExp: 10,
    
    // Множитель усталости за медитацию
    fatigueFactor: 0.1
  }
};

module.exports = config;
