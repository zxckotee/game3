/**
 * Тестирование моделей PvP-системы и работы сервиса с ORM
 */
const modelRegistry = require('../models/registry');
const PvPService = require('../services/pvp-service');

/**
 * Тестирование инициализации моделей PvP
 */
async function testModelsInitialization() {
  console.log('Тестирование инициализации моделей PvP...');
  
  try {
    // Инициализируем реестр моделей
    await modelRegistry.initializeRegistry();
    
    // Проверяем наличие всех моделей PvP
    const models = [
      'PvPMode',
      'PvPRoom',
      'PvPParticipant',
      'PvPAction',
      'PvPRating',
      'PvPHistory',
      'PvPReward'
    ];
    
    let allModelsFound = true;
    for (const modelName of models) {
      const model = modelRegistry.getModel(modelName);
      if (!model) {
        console.error(`❌ Модель ${modelName} не найдена`);
        allModelsFound = false;
      } else {
        console.log(`✅ Модель ${modelName} успешно инициализирована`);
      }
    }
    
    if (allModelsFound) {
      console.log('✅ Все модели PvP успешно инициализированы');
    } else {
      console.error('❌ Не все модели PvP были инициализированы');
    }
  } catch (error) {
    console.error('❌ Ошибка при инициализации моделей:', error);
  }
}

/**
 * Тестирование базовых операций с моделями PvP
 */
async function testBasicOperations() {
  console.log('\nТестирование базовых операций с моделями PvP...');
  
  try {
    // Инициализируем реестр моделей, если еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели
    const PvPMode = modelRegistry.getModel('PvPMode');
    
    // Тестирование операции чтения - получаем все режимы
    const modes = await PvPMode.findAll();
    console.log(`✅ Получено ${modes.length} режимов PvP`);
    
    if (modes.length === 0) {
      // Если режимов нет, создаем тестовый режим
      console.log('Создаем тестовый режим PvP...');
      
      const newMode = await PvPMode.create({
        name: 'Тестовый режим',
        description: 'Режим для тестирования',
        player_count: 2,
        enabled: true,
        rules: { maxRounds: 10 },
        rewards_config: { winPoints: 100, lossPoints: 10 }
      });
      
      console.log(`✅ Создан тестовый режим с ID ${newMode.id}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при выполнении базовых операций с моделями:', error);
  }
}

/**
 * Тестирование сервиса PvP с использованием ORM
 */
async function testPvPService() {
  console.log('\nТестирование сервиса PvP с использованием ORM...');
  
  try {
    // Тестирование метода getModes
    const modes = await PvPService.getModes();
    console.log(`✅ Метод getModes() успешно вернул ${modes.length} режимов`);
    
    // Проверяем наличие режимов для дальнейшего тестирования
    if (modes.length === 0) {
      console.log('⚠️ В базе нет режимов PvP, дальнейшее тестирование невозможно');
      return;
    }
    
    // Выбираем первый режим для тестирования
    const modeId = modes[0].id;
    
    // Тестируем получение комнат
    const rooms = await PvPService.getRooms();
    console.log(`✅ Метод getRooms() успешно вернул ${rooms.length} комнат`);
    
    // Тестируем создание комнаты, если она не будет использоваться
    // Этот код закомментирован, чтобы не создавать комнаты при каждом запуске теста
    /* 
    const roomName = `Тестовая комната ${Date.now()}`;
    const minLevel = 1;
    const maxLevel = 10;
    const userId = 1; // ID тестового пользователя
    
    const newRoom = await PvPService.createRoom(userId, roomName, modeId, minLevel, maxLevel);
    console.log(`✅ Метод createRoom() успешно создал комнату с ID ${newRoom.id}`);
    */
    
    // Тестируем получение рейтингов
    const userId = 1; // ID тестового пользователя
    const ratings = await PvPService.getUserRatings(userId);
    console.log(`✅ Метод getUserRatings() успешно вернул ${ratings.length} рейтингов`);
    
    // Тестируем получение таблицы лидеров
    const leaderboard = await PvPService.getLeaderboard(modeId);
    console.log(`✅ Метод getLeaderboard() успешно вернул ${leaderboard.length} записей`);
    
    // Тестируем получение истории боев
    const history = await PvPService.getUserBattleHistory(userId);
    console.log(`✅ Метод getUserBattleHistory() успешно вернул ${history.length} записей`);
    
    // Тестируем получение наград
    const rewards = await PvPService.getAvailableRewards();
    console.log(`✅ Метод getAvailableRewards() успешно вернул ${rewards.length} наград`);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании сервиса PvP:', error);
  }
}

/**
 * Запуск всех тестов
 */
async function runAllTests() {
  console.log('======= ТЕСТИРОВАНИЕ PVP-МОДЕЛЕЙ И СЕРВИСА =======');
  
  try {
    await testModelsInitialization();
    await testBasicOperations();
    await testPvPService();
    
    console.log('\n✅ Все тесты выполнены');
  } catch (error) {
    console.error('\n❌ Ошибка при выполнении тестов:', error);
  }
}

// Запускаем тесты
runAllTests();