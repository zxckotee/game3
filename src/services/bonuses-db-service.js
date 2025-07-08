/**
 * Сервис для работы с таблицей bonuses в базе данных
 * Предоставляет методы для получения, добавления, обновления и удаления бонусов
 */
const { pool } = require('./database');

/**
 * Получение всех бонусов из таблицы
 * @returns {Promise<Array>} Массив всех бонусов
 */
async function getAllBonuses() {
  try {
    const query = `
      SELECT id, type, modifier, modifier_type, description, created_at, updated_at
      FROM bonuses
      ORDER BY type, modifier_type
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении всех бонусов:', error);
    throw error;
  }
}

/**
 * Получение бонуса по ID
 * @param {number} id ID бонуса
 * @returns {Promise<Object|null>} Объект бонуса или null, если бонус не найден
 */
async function getBonusById(id) {
  try {
    const query = `
      SELECT id, type, modifier, modifier_type, description, created_at, updated_at
      FROM bonuses
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(`Ошибка при получении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Получение бонусов по типу
 * @param {string} type Тип бонуса
 * @returns {Promise<Array>} Массив бонусов указанного типа
 */
async function getBonusesByType(type) {
  try {
    const query = `
      SELECT id, type, modifier, modifier_type, description, created_at, updated_at
      FROM bonuses
      WHERE type = $1
      ORDER BY modifier_type, modifier
    `;
    const result = await pool.query(query, [type]);
    return result.rows;
  } catch (error) {
    console.error(`Ошибка при получении бонусов типа ${type}:`, error);
    throw error;
  }
}

/**
 * Получение бонусов по типу модификатора
 * @param {string} modifierType Тип модификатора (percent, flat, chance)
 * @returns {Promise<Array>} Массив бонусов с указанным типом модификатора
 */
async function getBonusesByModifierType(modifierType) {
  try {
    const query = `
      SELECT id, type, modifier, modifier_type, description, created_at, updated_at
      FROM bonuses
      WHERE modifier_type = $1
      ORDER BY type, modifier
    `;
    const result = await pool.query(query, [modifierType]);
    return result.rows;
  } catch (error) {
    console.error(`Ошибка при получении бонусов с типом модификатора ${modifierType}:`, error);
    throw error;
  }
}

/**
 * Добавление нового бонуса
 * @param {Object} bonusData Данные нового бонуса
 * @param {string} bonusData.type Тип бонуса
 * @param {number} bonusData.modifier Значение модификатора
 * @param {string} bonusData.modifier_type Тип модификатора (percent, flat, chance)
 * @param {string} [bonusData.description] Описание бонуса
 * @returns {Promise<Object>} Созданный бонус
 */
async function createBonus(bonusData) {
  try {
    const { type, modifier, modifier_type, description } = bonusData;
    
    const query = `
      INSERT INTO bonuses (type, modifier, modifier_type, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, type, modifier, modifier_type, description, created_at, updated_at
    `;
    
    const values = [type, modifier, modifier_type, description || null];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при создании нового бонуса:', error);
    throw error;
  }
}

/**
 * Обновление существующего бонуса
 * @param {number} id ID бонуса для обновления
 * @param {Object} bonusData Данные для обновления
 * @param {string} [bonusData.type] Тип бонуса
 * @param {number} [bonusData.modifier] Значение модификатора
 * @param {string} [bonusData.modifier_type] Тип модификатора (percent, flat, chance)
 * @param {string} [bonusData.description] Описание бонуса
 * @returns {Promise<Object|null>} Обновленный бонус или null, если бонус не найден
 */
async function updateBonus(id, bonusData) {
  try {
    // Получаем текущие данные бонуса
    const currentBonus = await getBonusById(id);
    if (!currentBonus) {
      return null;
    }
    
    // Объединяем текущие данные с новыми
    const updatedData = {
      type: bonusData.type || currentBonus.type,
      modifier: bonusData.modifier !== undefined ? bonusData.modifier : currentBonus.modifier,
      modifier_type: bonusData.modifier_type || currentBonus.modifier_type,
      description: bonusData.description !== undefined ? bonusData.description : currentBonus.description
    };
    
    const query = `
      UPDATE bonuses
      SET type = $1, modifier = $2, modifier_type = $3, description = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, type, modifier, modifier_type, description, created_at, updated_at
    `;
    
    const values = [updatedData.type, updatedData.modifier, updatedData.modifier_type, updatedData.description, id];
    const result = await pool.query(query, values);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(`Ошибка при обновлении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Удаление бонуса по ID
 * @param {number} id ID бонуса для удаления
 * @returns {Promise<boolean>} true, если бонус успешно удален, иначе false
 */
async function deleteBonus(id) {
  try {
    const query = `
      DELETE FROM bonuses
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Ошибка при удалении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Получение всех типов бонусов из таблицы
 * @returns {Promise<Array<string>>} Массив уникальных типов бонусов
 */
async function getAllBonusTypes() {
  try {
    const query = `
      SELECT DISTINCT type
      FROM bonuses
      ORDER BY type
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.type);
  } catch (error) {
    console.error('Ошибка при получении всех типов бонусов:', error);
    throw error;
  }
}

/**
 * Получение всех типов модификаторов из таблицы
 * @returns {Promise<Array<string>>} Массив уникальных типов модификаторов
 */
async function getAllModifierTypes() {
  try {
    const query = `
      SELECT DISTINCT modifier_type
      FROM bonuses
      ORDER BY modifier_type
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.modifier_type);
  } catch (error) {
    console.error('Ошибка при получении всех типов модификаторов:', error);
    throw error;
  }
}

module.exports = {
  getAllBonuses,
  getBonusById,
  getBonusesByType,
  getBonusesByModifierType,
  createBonus,
  updateBonus,
  deleteBonus,
  getAllBonusTypes,
  getAllModifierTypes
};