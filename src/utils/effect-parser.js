'use strict';

/**
 * Парсит стандартизированную строку описания эффекта.
 * Формат: ДЕЙСТВИЕ[параметр1=значение1;параметр2=значение2;...]
 * Пример: BUFF[target_stat=cultivation_speed;value=10;unit=percent;duration=1h]
 * @param {string} descriptionString - Строка описания эффекта.
 * @returns {object|null} Объект с action и params, или null при ошибке парсинга.
 */
function parseEffectDescription(descriptionString) {
  if (!descriptionString || typeof descriptionString !== 'string') {
    console.error('Invalid effect description string:', descriptionString);
    return null;
  }

  const match = descriptionString.match(/^([A-Z_]+)\[(.*)\]$/);
  if (!match) {
    console.error('Effect description string does not match ACTION[params] format:', descriptionString);
    return null;
  }

  const action = match[1];
  const paramsString = match[2];
  const params = {};

  if (paramsString) {
    paramsString.split(';').forEach(paramPair => {
      const pair = paramPair.split('=');
      if (pair.length === 2) {
        const key = pair[0].trim();
        let value = pair[1].trim();

        // Попытка преобразовать числовые значения и булевы
        if (!isNaN(value) && value.trim() !== '') {
          value = Number(value);
        } else if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        }
        // Для длительностей типа "1h", "30m", "10s" можно добавить отдельную логику конвертации в секунды
        // Например, если ключ 'duration':
        if (key === 'duration') {
          value = parseDuration(value);
        }
        params[key] = value;
      }
    });
  }

  return { action, params };
}

/**
 * Парсит строку длительности (например, "1h", "30m", "10s", "1h30m") в секунды.
 * @param {string} durationStr - Строка длительности.
 * @returns {number|string} Количество секунд или исходная строка, если не удалось распарсить.
 */
function parseDuration(durationStr) {
  if (typeof durationStr !== 'string') return durationStr;

  let totalSeconds = 0;
  const hourMatch = durationStr.match(/(\d+)h/);
  const minuteMatch = durationStr.match(/(\d+)m/);
  const secondMatch = durationStr.match(/(\d+)s/);

  if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  if (minuteMatch) totalSeconds += parseInt(minuteMatch[1], 10) * 60;
  if (secondMatch) totalSeconds += parseInt(secondMatch[1], 10);
  
  // Если ничего не совпало и строка не является просто числом (уже обработано выше)
  // то, возможно, это уже количество секунд или непарсируемый формат.
  // Если totalSeconds === 0 и исходная строка не "0", "0s" и т.п., возвращаем исходную строку.
  if (totalSeconds === 0 && !/^0[hms]?$/.test(durationStr) && isNaN(Number(durationStr))) {
      return durationStr; 
  }

  return totalSeconds;
}

module.exports = {
  parseEffectDescription,
  parseDuration,
};