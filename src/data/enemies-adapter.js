/**
 * Адаптер для выбора подходящей версии enemies.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const ClientEnemies = require('./client-enemies');

// Определение объекта в зависимости от окружения
let Enemies;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  Enemies = ClientEnemies;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerEnemies = require('./enemies');
    Enemies = ServerEnemies;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии enemies:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    Enemies = ClientEnemies;
  }
}

/**
 * Нормализует данные врага, обеспечивая правильный формат защиты
 * @param {Object} enemy - Объект с данными врага
 * @returns {Object} - Нормализованный объект врага
 */
function normalizeEnemyData(enemy) {
  if (!enemy || !enemy.stats) return enemy;
  
  const normalizedEnemy = { ...enemy };
  const stats = { ...enemy.stats };
  
  // Если есть только defense, но нет physicalDefense/spiritualDefense
  if (stats.defense !== undefined &&
      (stats.physicalDefense === undefined || stats.spiritualDefense === undefined)) {
    // Преобразуем defense в physicalDefense и spiritualDefense
    stats.physicalDefense = stats.defense;
    stats.spiritualDefense = stats.defense; // По умолчанию одинаковые значения для обоих типов защиты
    
    // Сохраняем исходное значение для обратной совместимости
    stats.defense = stats.defense;
  }
  
  // Если нет defense вообще (это ошибка), устанавливаем значения по умолчанию
  if (stats.defense === undefined &&
      stats.physicalDefense === undefined &&
      stats.spiritualDefense === undefined) {
    stats.physicalDefense = 0;
    stats.spiritualDefense = 0;
    stats.defense = 0;
  }
  
  // Добавляем точность (accuracy), если она отсутствует
  if (stats.accuracy === undefined) {
    // Вычисляем базовую точность на основе уровня и других параметров
    const level = enemy.level || 1;
    stats.accuracy = Math.floor(10 + level * 2); // Базовая формула: 10 + уровень*2
  }
  
  // Добавляем уклонение (evasion), если оно отсутствует
  if (stats.evasion === undefined) {
    // Вычисляем базовое уклонение на основе скорости
    const speed = stats.speed || 0;
    stats.evasion = Math.floor(5 + speed * 0.5); // Базовая формула: 5 + скорость*0.5
  }
  
  normalizedEnemy.stats = stats;
  return normalizedEnemy;
}

// Экспортируем константы и функции
const enemyRanks = Enemies.enemyRanks;

// Нормализуем существующих врагов
const enemies = (Enemies.enemies || []).map(enemy => normalizeEnemyData(enemy));

const getTimeOfDaySpawnModifiers = Enemies.getTimeOfDaySpawnModifiers;
const getWeatherSpawnModifiers = Enemies.getWeatherSpawnModifiers;
const getModifiedEnemySpawns = Enemies.getModifiedEnemySpawns;

// Оборачиваем методы для нормализации данных
const getAllEnemies = async function() {
  const result = await Enemies.getAllEnemies();
  return Array.isArray(result) ? result.map(enemy => normalizeEnemyData(enemy)) : result;
};

const getEnemyById = async function(id) {
  const result = await Enemies.getEnemyById(id);
  return normalizeEnemyData(result);
};

const initEnemyData = Enemies.initEnemyData;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = Enemies;

// Экспортируем именованные функции для ES6 импорта
module.exports.enemies = enemies;
module.exports.enemyRanks = enemyRanks;
module.exports.getTimeOfDaySpawnModifiers = getTimeOfDaySpawnModifiers;
module.exports.getWeatherSpawnModifiers = getWeatherSpawnModifiers;
module.exports.getModifiedEnemySpawns = getModifiedEnemySpawns;
module.exports.getAllEnemies = getAllEnemies;
module.exports.getEnemyById = getEnemyById;
module.exports.initEnemyData = initEnemyData;
module.exports.normalizeEnemyData = normalizeEnemyData; // Экспортируем функцию нормализации