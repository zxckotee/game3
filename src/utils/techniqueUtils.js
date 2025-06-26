/**
 * Утилиты для работы с техниками
 */
const { techniques } = require('../data/techniques-adapter');

/**
 * Нормализует ID техники (заменяет подчеркивания на дефисы)
 * @param {string} id - ID техники
 * @returns {string} - Нормализованный ID техники
 */
const normalizeId = (id) => {
  if (!id) return id;
  return id.replace(/_/g, '-');
};

/**
 * Проверяет совместимость ID (поддержка обоих форматов)
 * @param {string} id1 - Первый ID
 * @param {string} id2 - Второй ID
 * @returns {boolean} - true, если ID совместимы
 */
const isSameId = (id1, id2) => {
  if (!id1 || !id2) return false;
  return normalizeId(id1) === normalizeId(id2);
};

/**
 * Патч для объекта техник, заменяющий подчеркивания на дефисы в ID
 * @param {Array|Object} techniques - Массив или объект техник
 * @returns {Array|Object} - Обновленный массив или объект техник
 */
const normalizeTechniquesIds = (techniques) => {
  if (!techniques) return techniques;
  
  if (Array.isArray(techniques)) {
    return techniques.map(technique => {
      if (technique && technique.id && typeof technique.id === 'string') {
        if (technique.id.includes('_')) {
          const newId = normalizeId(technique.id);
          console.log(`Нормализован ID техники: ${technique.id} -> ${newId}`);
          return {
            ...technique,
            id: newId
          };
        }
      }
      return technique;
    });
  } else if (typeof techniques === 'object') {
    const result = {};
    Object.keys(techniques).forEach(key => {
      if (key.includes('_')) {
        const newKey = normalizeId(key);
        console.log(`Нормализован ключ техники: ${key} -> ${newKey}`);
        result[newKey] = techniques[key];
      } else {
        result[key] = techniques[key];
      }
    });
    return result;
  }
  
  return techniques;
};

/**
 * Находит базовую технику по ID
 * @param {string} id - ID техники
 * @returns {Object|null} - Базовое определение техники или null, если не найдено
 */
const findBaseTechniqueById = (id) => {
  if (!id) return null;
  const normalizedId = normalizeId(id);
  return techniques.find(t => normalizeId(t.id) === normalizedId) || null;
};

/**
 * Рассчитывает параметры техники на основе уровня
 * @param {Object} baseTechnique - Базовое определение техники
 * @param {number} level - Текущий уровень техники
 * @returns {Object} - Параметры техники с учетом уровня
 */
const calculateTechniqueStats = (baseTechnique, level = 1) => {
  if (!baseTechnique) return {};
  
  // Множитель на основе уровня (увеличение на 20% за каждый уровень)
  const levelMultiplier = 1 + (level - 1) * 0.2;
  
  // Рассчитываем новые параметры с учетом уровня
  const calculatedStats = {
    damage: baseTechnique.damage ? Math.floor(baseTechnique.damage * levelMultiplier) : 0,
    healing: baseTechnique.healing ? Math.floor(baseTechnique.healing * levelMultiplier) : 0,
    energyCost: baseTechnique.energyCost ? Math.floor(baseTechnique.energyCost * (1 + (level - 1) * 0.1)) : 10
  };
  
  // Обрабатываем эффекты
  if (Array.isArray(baseTechnique.effects)) {
    calculatedStats.effects = baseTechnique.effects.map(effect => {
      const updatedEffect = { ...effect };
      
      // Увеличиваем урон эффекта
      if (updatedEffect.damage) {
        updatedEffect.damage = Math.floor(updatedEffect.damage * levelMultiplier);
      }
      
      // Увеличиваем исцеление эффекта
      if (updatedEffect.healing) {
        updatedEffect.healing = Math.floor(updatedEffect.healing * levelMultiplier);
      }
      
      return updatedEffect;
    });
  }
  
  return calculatedStats;
};

/**
 * Проверяет технику на наличие всех необходимых полей
 * @param {Object} technique - Техника для проверки
 * @returns {boolean} - true, если техника имеет все необходимые поля
 */
const isTechniqueValid = (technique) => {
  if (!technique || !technique.id) return false;
  
  // Список необходимых полей
  const requiredFields = [
    'name', 'description', 'type', 'icon', 
    'damage', 'damageType', 'energyCost', 'cooldown',
    'level', 'maxLevel'
  ];
  
  // Проверяем наличие всех полей
  for (const field of requiredFields) {
    if (technique[field] === undefined) {
      return false;
    }
  }
  
  // Проверяем наличие массива эффектов
  if (!Array.isArray(technique.effects)) {
    return false;
  }
  
  return true;
};

/**
 * Восстанавливает техники на основе их ID и level
 * @param {Array} techniques - Массив техник для восстановления
 * @returns {Array} - Массив восстановленных техник
 */
const repairTechniques = (playerTechniques) => {
  if (!Array.isArray(playerTechniques) || playerTechniques.length === 0) {
    console.log('Нет техник для восстановления');
    return [];
  }
  
  console.log(`🛠️ Запущено восстановление ${playerTechniques.length} техник...`);
  
  const repairedTechniques = playerTechniques.map(technique => {
    // Всегда восстанавливаем технику, даже если она кажется валидной
    console.log(`🔄 Восстановление техники с ID: ${technique.id}...`);
    
    // Получаем базовое определение техники
    const baseTechnique = findBaseTechniqueById(technique.id);
    
    if (!baseTechnique) {
      console.warn(`⚠️ Не найдено базовое определение для техники с ID: ${technique.id}. Возвращаем оригинал.`);
      return technique; // Возвращаем как есть, если не нашли базовое определение
    }
    
    // Сохраняем важные пользовательские данные
    const level = typeof technique.level === 'number' ? technique.level : 1;
    const experience = typeof technique.experience === 'number' ? technique.experience : 0;
    const masteryLevel = typeof technique.masteryLevel === 'number' ? technique.masteryLevel : 0;
    const lastUsed = technique.lastUsed || null;
    const requiredLevel = technique.requiredLevel || baseTechnique.requiredLevel || 1;
    
    // Рассчитываем параметры с учетом уровня
    const calculatedStats = calculateTechniqueStats(baseTechnique, level);
    
    // ВАЖНО: Создаем восстановленную технику, начиная с базового определения,
    // затем добавляем рассчитанные статы, и только потом пользовательские данные
    const repairedTechnique = {
      ...baseTechnique,           // Базовые свойства из techniques.js
      ...calculatedStats,         // Рассчитанные статы с учетом уровня
      id: technique.id,           // Сохраняем оригинальный ID
      level,                      // Сохраняем уровень
      experience,                 // Сохраняем опыт
      lastUsed,                   // Сохраняем время последнего использования
      masteryLevel,               // Сохраняем уровень мастерства
      requiredLevel               // Сохраняем требуемый уровень
    };
    
    console.log(`✅ Техника восстановлена: ${repairedTechnique.name} (Уровень: ${level}, Урон: ${repairedTechnique.damage}, Кулдаун: ${repairedTechnique.cooldown})`);
    return repairedTechnique;
  });
  
  return repairedTechniques;
};

module.exports = {
  normalizeId,
  isSameId,
  normalizeTechniquesIds,
  findBaseTechniqueById,
  calculateTechniqueStats,
  isTechniqueValid,
  repairTechniques
};
