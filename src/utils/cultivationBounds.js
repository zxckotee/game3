/**
 * Утилиты для безопасного обновления значений опыта и энергии с проверкой границ
 */

/**
 * Безопасно обновляет энергию с проверкой границ
 * @param {number} currentEnergy - Текущее значение энергии
 * @param {number} change - Изменение энергии (может быть отрицательным)
 * @param {number} maxEnergy - Максимальное значение энергии
 * @param {number} minEnergy - Минимальное значение энергии (по умолчанию 0)
 * @returns {number} Новое значение энергии в пределах границ
 */
export function safeUpdateEnergy(currentEnergy, change, maxEnergy, minEnergy = 0) {
  const current = Number(currentEnergy) || 0;
  const delta = Number(change) || 0;
  const max = Number(maxEnergy) || 100;
  const min = Number(minEnergy) || 0;
  
  const newValue = current + delta;
  return Math.max(min, Math.min(max, newValue));
}

/**
 * Безопасно обновляет опыт с проверкой границ
 * @param {number} currentExperience - Текущее значение опыта
 * @param {number} change - Изменение опыта (может быть отрицательным)
 * @param {number} maxExperience - Максимальное значение опыта
 * @param {number} minExperience - Минимальное значение опыта (по умолчанию 0)
 * @returns {number} Новое значение опыта в пределах границ
 */
export function safeUpdateExperience(currentExperience, change, maxExperience, minExperience = 0) {
  const current = Number(currentExperience) || 0;
  const delta = Number(change) || 0;
  const max = Number(maxExperience) || 100;
  const min = Number(minExperience) || 0;
  
  const newValue = current + delta;
  return Math.max(min, Math.min(max, newValue));
}

/**
 * Проверяет, достаточно ли энергии для операции
 * @param {number} currentEnergy - Текущее значение энергии
 * @param {number} requiredEnergy - Требуемое количество энергии
 * @returns {boolean} true, если энергии достаточно
 */
export function hasEnoughEnergy(currentEnergy, requiredEnergy) {
  const current = Number(currentEnergy) || 0;
  const required = Number(requiredEnergy) || 0;
  return current >= required;
}

/**
 * Проверяет, достаточно ли опыта для операции
 * @param {number} currentExperience - Текущее значение опыта
 * @param {number} requiredExperience - Требуемое количество опыта
 * @returns {boolean} true, если опыта достаточно
 */
export function hasEnoughExperience(currentExperience, requiredExperience) {
  const current = Number(currentExperience) || 0;
  const required = Number(requiredExperience) || 0;
  return current >= required;
}

/**
 * Безопасно обновляет объект культивации с проверкой всех границ
 * @param {Object} cultivation - Объект культивации
 * @param {Object} changes - Изменения для применения
 * @returns {Object} Обновленный объект культивации
 */
export function safeUpdateCultivation(cultivation, changes) {
  const result = { ...cultivation };
  
  if (changes.energy !== undefined) {
    result.energy = safeUpdateEnergy(
      cultivation.energy,
      changes.energy - (cultivation.energy || 0),
      cultivation.maxEnergy || 100
    );
  }
  
  if (changes.experience !== undefined) {
    result.experience = safeUpdateExperience(
      cultivation.experience,
      changes.experience - (cultivation.experience || 0),
      cultivation.experienceToNextLevel || 100
    );
  }
  
  if (changes.maxEnergy !== undefined) {
    result.maxEnergy = Math.max(1, Number(changes.maxEnergy) || 100);
    // Если максимальная энергия изменилась, проверяем текущую энергию
    result.energy = Math.min(result.energy || 0, result.maxEnergy);
  }
  
  if (changes.experienceToNextLevel !== undefined) {
    result.experienceToNextLevel = Math.max(1, Number(changes.experienceToNextLevel) || 100);
    // Если максимальный опыт изменился, проверяем текущий опыт
    result.experience = Math.min(result.experience || 0, result.experienceToNextLevel);
  }
  
  return result;
}

/**
 * Создает SQL выражение для безопасного обновления энергии
 * @param {number} change - Изменение энергии
 * @param {number} maxEnergy - Максимальная энергия (опционально)
 * @returns {string} SQL выражение
 */
export function createSafeEnergyUpdateSQL(change, maxEnergy = null) {
  const delta = Number(change) || 0;
  
  if (delta >= 0) {
    // Увеличение энергии - ограничиваем максимумом
    if (maxEnergy !== null) {
      return `LEAST(energy + ${delta}, ${maxEnergy})`;
    } else {
      return `LEAST(energy + ${delta}, max_energy)`;
    }
  } else {
    // Уменьшение энергии - ограничиваем минимумом (0)
    return `GREATEST(energy + ${delta}, 0)`;
  }
}

/**
 * Создает SQL выражение для безопасного обновления опыта
 * @param {number} change - Изменение опыта
 * @param {number} maxExperience - Максимальный опыт (опционально)
 * @returns {string} SQL выражение
 */
export function createSafeExperienceUpdateSQL(change, maxExperience = null) {
  const delta = Number(change) || 0;
  
  if (delta >= 0) {
    // Увеличение опыта - ограничиваем максимумом
    if (maxExperience !== null) {
      return `LEAST(experience + ${delta}, ${maxExperience})`;
    } else {
      return `LEAST(experience + ${delta}, experience_to_next_level)`;
    }
  } else {
    // Уменьшение опыта - ограничиваем минимумом (0)
    return `GREATEST(experience + ${delta}, 0)`;
  }
}

/**
 * Валидирует значения культивации
 * @param {Object} cultivation - Объект культивации для валидации
 * @returns {Object} Объект с результатами валидации
 */
export function validateCultivation(cultivation) {
  const errors = [];
  const warnings = [];
  
  const energy = Number(cultivation.energy) || 0;
  const maxEnergy = Number(cultivation.maxEnergy) || 100;
  const experience = Number(cultivation.experience) || 0;
  const experienceToNextLevel = Number(cultivation.experienceToNextLevel) || 100;
  
  // Проверка энергии
  if (energy < 0) {
    errors.push(`Энергия не может быть отрицательной: ${energy}`);
  }
  if (energy > maxEnergy) {
    errors.push(`Энергия превышает максимум: ${energy} > ${maxEnergy}`);
  }
  
  // Проверка опыта
  if (experience < 0) {
    errors.push(`Опыт не может быть отрицательным: ${experience}`);
  }
  if (experience > experienceToNextLevel) {
    errors.push(`Опыт превышает максимум: ${experience} > ${experienceToNextLevel}`);
  }
  
  // Предупреждения
  if (maxEnergy <= 0) {
    warnings.push(`Максимальная энергия должна быть положительной: ${maxEnergy}`);
  }
  if (experienceToNextLevel <= 0) {
    warnings.push(`Максимальный опыт должен быть положительным: ${experienceToNextLevel}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}