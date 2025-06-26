/**
 * Тестовый скрипт для проверки API прорыва в системе культивации
 * 
 * Для запуска:
 * node src/tests/test-breakthrough.js <userId>
 */

const axios = require('axios');

// Получаем ID пользователя из аргументов командной строки
const userId = process.argv[2];

if (!userId) {
  console.error('Пожалуйста, укажите ID пользователя в качестве аргумента.');
  console.error('Пример: node src/tests/test-breakthrough.js 1');
  process.exit(1);
}

// Базовый URL API
const API_BASE_URL = 'http://localhost:3000';

/**
 * Проверка возможности прорыва
 */
async function checkBreakthroughPossibility() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/cultivation/${userId}/breakthrough-check`);
    console.log('\n=== Проверка возможности прорыва ===');
    console.log('Результат:', response.data);
    
    if (!response.data.canBreakthrough) {
      console.log('\nНедостающие требования:');
      response.data.missingRequirements.forEach((req, index) => {
        console.log(`${index + 1}. ${req}`);
      });
    }
    
    return response.data.canBreakthrough;
  } catch (error) {
    console.error('Ошибка при проверке возможности прорыва:', error.message);
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    }
    return false;
  }
}

/**
 * Получение текущих данных о культивации
 */
async function getCultivationData() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/cultivation/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении данных о культивации:', error.message);
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    }
    return null;
  }
}

/**
 * Выполнение прорыва
 */
async function performBreakthrough() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/cultivation/${userId}/breakthrough`);
    console.log('\n=== Результат прорыва ===');
    console.log('Статус:', response.data.success ? 'Успешно' : 'Неудача');
    console.log('Сообщение:', response.data.message);
    
    if (response.data.success) {
      console.log('\nИзменения:');
      console.log(`Предыдущее состояние: ${response.data.previousState.stage} уровень ${response.data.previousState.level}`);
      console.log(`Новое состояние: ${response.data.newState.stage} уровень ${response.data.newState.level}`);
      
      console.log('\nПолученные бонусы:');
      console.log(`- Максимальная энергия: +${response.data.bonuses.maxEnergy}`);
      console.log(`- Очки характеристик: +${response.data.statPoints}`);
      
      if (response.data.isNewStage) {
        console.log('\n!!! Достигнут новый этап культивации !!!');
      }
    } else if (response.data.missingRequirements) {
      console.log('\nНедостающие требования:');
      response.data.missingRequirements.forEach((req, index) => {
        console.log(`${index + 1}. ${req}`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при выполнении прорыва:', error.message);
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    }
    return null;
  }
}

/**
 * Увеличение прогресса "бутылочного горлышка"
 */
async function increaseBottleneckProgress(amount) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/cultivation/${userId}/increase-bottleneck`, {
      amount
    });
    console.log('\n=== Увеличение прогресса "бутылочного горлышка" ===');
    console.log('Результат:', response.data.message);
    console.log(`Прогресс: ${response.data.bottleneckProgress}/${response.data.requiredBottleneckProgress}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при увеличении прогресса "бутылочного горлышка":', error.message);
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    }
    return null;
  }
}

/**
 * Вывод текущих данных о культивации
 */
async function printCultivationData() {
  const data = await getCultivationData();
  if (!data) return;
  
  console.log('\n=== Текущие данные о культивации ===');
  console.log(`Ступень: ${data.stage}`);
  console.log(`Уровень: ${data.level}`);
  console.log(`Опыт: ${data.experience}/${data.experienceToNextLevel}`);
  console.log(`Энергия: ${data.energy}/${data.maxEnergy}`);
  console.log(`Прогресс "бутылочного горлышка": ${data.bottleneckProgress}/${data.requiredBottleneckProgress}`);
  console.log(`Трибуляция пройдена: ${data.tribulationCompleted ? 'Да' : 'Нет'}`);
  console.log(`Эффективность культивации: ${data.cultivationEfficiency}`);
}

/**
 * Подготовка к прорыву (заполнение прогресса "бутылочного горлышка")
 */
async function prepareForBreakthrough() {
  const data = await getCultivationData();
  if (!data) return false;
  
  console.log('\n=== Подготовка к прорыву ===');
  
  // Если прогресс "бутылочного горлышка" не заполнен, заполняем его
  if (data.bottleneckProgress < data.requiredBottleneckProgress) {
    const neededProgress = data.requiredBottleneckProgress - data.bottleneckProgress;
    console.log(`Необходимо увеличить прогресс "бутылочного горлышка" на ${neededProgress} единиц`);
    
    await increaseBottleneckProgress(neededProgress);
  } else {
    console.log('Прогресс "бутылочного горлышка" уже заполнен');
  }
  
  return true;
}

/**
 * Основная функция для тестирования API прорыва
 */
async function testBreakthrough() {
  console.log(`Тестирование API прорыва для пользователя с ID ${userId}`);
  
  // Выводим текущие данные о культивации
  await printCultivationData();
  
  // Проверяем возможность прорыва
  const canBreakthrough = await checkBreakthroughPossibility();
  
  if (!canBreakthrough) {
    // Подготавливаем пользователя к прорыву
    const prepared = await prepareForBreakthrough();
    
    if (prepared) {
      // Повторно проверяем возможность прорыва
      const canBreakthroughNow = await checkBreakthroughPossibility();
      
      if (!canBreakthroughNow) {
        console.log('\nДаже после подготовки прорыв невозможен. Проверьте другие требования (опыт, трибуляция).');
        return;
      }
    } else {
      console.log('\nНе удалось подготовиться к прорыву. Проверьте данные о культивации.');
      return;
    }
  }
  
  // Выполняем прорыв
  await performBreakthrough();
  
  // Выводим обновленные данные о культивации
  await printCultivationData();
}

// Запускаем тестирование
testBreakthrough().catch(error => {
  console.error('Критическая ошибка при тестировании:', error);
});