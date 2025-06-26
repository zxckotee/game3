// Импортируем React для использования hooks в integrateRelationshipSyncer
const React = require('react');

/**
 * Модуль для синхронизации отношений между игроком и сектами, членами секты и для расчета скидок у торговцев
 * на основе лояльности (уровня отношений) с игроком.
 */

/**
 * Рассчитывает процент скидки на основе уровня лояльности/отношений
 * @param {number} loyaltyLevel - Уровень лояльности (отношений)
 * @returns {number} - Процент скидки (положительное значение) или наценки (отрицательное значение)
 */
const calculateMerchantDiscount = (loyaltyLevel) => {
  // Проверка входных данных
  if (typeof loyaltyLevel !== 'number' || loyaltyLevel < 0) {
    return 0;
  }
  
  // Новая система скидок:
  // - При уровне лояльности >= 50: скидка по формуле loyaltyLevel/10
  // - При уровне лояльности <= 20: наценка 10%
  // - При уровне лояльности 21-49: нейтральная цена (ни скидки, ни наценки)
  
  if (loyaltyLevel >= 50) {
    // Скидка по формуле: лояльность/10
    // Например, при лояльности 70 скидка составит 7%
    const discount = Math.floor(loyaltyLevel / 10);
    
    // Ограничиваем скидку в пределах до 50%
    return Math.min(50, discount);
  } else if (loyaltyLevel <= 20) {
    // Наценка 10% при низкой лояльности
    return -10;
  } else {
    // Нейтральная цена (ни скидки, ни наценки) при средней лояльности
    return 0;
  }
};

/**
 * Применяет скидку или наценку к базовой цене на основе уровня лояльности
 * @param {number} basePrice - Базовая цена товара
 * @param {number} loyaltyLevel - Уровень лояльности (отношений)
 * @returns {object} - Объект с окончательной ценой и процентом скидки/наценки
 */
const applyLoyaltyDiscount = (basePrice, loyaltyLevel) => {
  // Получаем процент скидки/наценки
  const discount = calculateMerchantDiscount(loyaltyLevel);
  
  // Если скидки/наценки нет, возвращаем исходную цену
  if (discount === 0) {
    return { finalPrice: basePrice, discount: 0 };
  }
  
  let finalPrice;
  
  if (discount < 0) {
    // Если значение отрицательное - это наценка (штраф)
    // Формула: basePrice * (1 + |discount|/100)
    const surcharge = Math.abs(discount);
    finalPrice = Math.floor(basePrice * (1 + surcharge / 100));
  } else {
    // Если значение положительное - это скидка
    // Формула: basePrice * (1 - discount/100)
    finalPrice = Math.floor(basePrice * (1 - discount / 100));
  }
  
  // Убеждаемся, что цена не становится отрицательной или ниже 1
  finalPrice = Math.max(1, finalPrice);
  
  return {
    finalPrice,
    discount   // Сохраняем оригинальный знак, чтобы UI мог отобразить скидку/наценку
  };
};

/**
 * Синхронизирует лояльность секты с социальными отношениями
 * @param {Array} relationships - массив социальных отношений игрока
 * @param {Object} sect - объект секты
 * @param {Number} sectLoyalty - уровень лояльности секты
 * @returns {Array} обновленный массив социальных отношений
 */
const syncSectRelationshipToSocial = (relationships = [], sect, sectLoyalty) => {
  // Если нет секты или лояльности, возвращаем отношения без изменений
  if (!sect || sectLoyalty === undefined || sectLoyalty === null) {
    console.warn('⚠️ Невозможно синхронизировать отношения с сектой: неполные данные о секте');
    return relationships;
  }

  // Проверяем, что relationships - массив
  if (!Array.isArray(relationships)) {
    console.warn('⚠️ Объект отношений не является массивом, создаем новый массив');
    relationships = [];
  }

  // Находим существующую запись об отношениях с сектой
  const sectRelationIndex = relationships.findIndex(rel => rel.name === sect.name);
  
  // Если нашли существующую запись, обновляем ее
  if (sectRelationIndex >= 0) {
    const updatedRelationships = [...relationships];
    updatedRelationships[sectRelationIndex] = {
      ...updatedRelationships[sectRelationIndex],
      level: sectLoyalty
    };
    
    console.log(`✅ Обновлены отношения с сектой "${sect.name}" до уровня ${sectLoyalty}`);
    return updatedRelationships;
  } 
  // Если не нашли запись, создаем новую
  else {
    const newRelationship = {
      id: Date.now(), // Генерируем новый ID (временная метка)
      name: sect.name,
      role: 'Секта',
      level: sectLoyalty,
      events: [`Вы присоединились к секте "${sect.name}"`]
    };
    
    console.log(`✅ Создана новая запись отношений с сектой "${sect.name}" с уровнем ${sectLoyalty}`);
    return [...relationships, newRelationship];
  }
};

/**
 * Синхронизирует социальные отношения с лояльностью секты
 * @param {Array} relationships - массив социальных отношений игрока 
 * @param {Object} sect - объект секты
 * @returns {Number|null} новое значение лояльности секты или null, если синхронизация невозможна
 */
const syncSocialToSectRelationship = (relationships = [], sect) => {
  // Если нет секты, синхронизация невозможна
  if (!sect) {
    console.warn('⚠️ Невозможно синхронизировать лояльность: секта не найдена');
    return null;
  }
  
  // Проверяем, что relationships - массив
  if (!Array.isArray(relationships)) {
    console.warn('⚠️ Объект отношений не является массивом');
    return null;
  }
  
  // Находим запись об отношениях с сектой
  const sectRelation = relationships.find(rel => rel.name === sect.name);
  
  // Если найдена запись, используем ее уровень отношений
  if (sectRelation && sectRelation.level !== undefined) {
    console.log(`✅ Найдена запись отношений с сектой "${sect.name}" с уровнем ${sectRelation.level}`);
    return sectRelation.level;
  } else {
    console.log(`⚠️ Запись отношений с сектой "${sect.name}" не найдена`);
    return null;
  }
};

/**
 * Синхронизирует отношения из лояльности членов секты в социальные отношения игрока
 * @param {Object} state - Текущее состояние игры
 * @returns {Object} - Обновленное состояние игры с синхронизированными отношениями
 */
const syncRelationshipsFromLoyalty = (state) => {
  // Убеждаемся, что у нас есть все необходимые данные
  if (!state.player || !state.player.social || !state.sect || !state.sect.sect) {
    console.warn("Невозможно синхронизировать отношения сект: недостаточно данных");
    return state;
  }
  
  const { player, sect } = state;
  const { relationships = [] } = player.social;
  const { members = [] } = sect.sect;
  
  // Начинаем с копии существующих отношений
  let updatedRelationships = [...relationships];
  
  // Затем для каждого члена секты находим соответствующее отношение
  // или создаем новое, если оно отсутствует
  members.forEach(member => {
    if (!member.name) return; // Пропускаем членов секты без имени
    
    // Ищем существующее отношение
    const existingRelationIndex = updatedRelationships.findIndex(
      rel => rel.name === member.name
    );
    
    // Если отношение существует, обновляем его, синхронизируя с лояльностью члена секты
    if (existingRelationIndex !== -1) {
      updatedRelationships[existingRelationIndex] = {
        ...updatedRelationships[existingRelationIndex],
        level: member.loyalty || 0,
        lastUpdated: Date.now()
      };
    } 
    // Если отношение не существует, создаем новое
    else {
      updatedRelationships.push({
        id: `sect_member_${member.id || Date.now()}`,
        name: member.name,
        type: 'sect_member',
        level: member.loyalty || 0,
        lastUpdated: Date.now()
      });
    }
  });
  
  // Обновляем состояние игрока
  return {
    ...state,
    player: {
      ...player,
      social: {
        ...player.social,
        relationships: updatedRelationships
      }
    }
  };
};

/**
 * Синхронизирует лояльность членов секты из социальных отношений игрока
 * @param {Object} state - Текущее состояние игры
 * @returns {Object} - Обновленное состояние игры с синхронизированной лояльностью
 */
const syncLoyaltyFromRelationships = (state) => {
  // Убеждаемся, что у нас есть все необходимые данные
  if (!state.player || !state.player.social || !state.sect || !state.sect.sect) {
    console.warn("Невозможно синхронизировать лояльность членов секты: недостаточно данных");
    return state;
  }
  
  const { player, sect } = state;
  const { relationships = [] } = player.social;
  let { members = [] } = sect.sect;
  
  // Создаем копию членов секты для модификации
  const updatedMembers = [...members];
  
  // Для каждого отношения ищем соответствующего члена секты и обновляем его лояльность
  relationships.forEach(relation => {
    // Пропускаем отношения без имени или не относящиеся к членам секты
    if (!relation.name) return;
    
    // Ищем соответствующего члена секты
    const memberIndex = updatedMembers.findIndex(
      member => member.name === relation.name
    );
    
    // Если нашли, обновляем его лояльность
    if (memberIndex !== -1) {
      updatedMembers[memberIndex] = {
        ...updatedMembers[memberIndex],
        loyalty: relation.level || 0
      };
    }
  });
  
  // Обновляем состояние секты
  return {
    ...state,
    sect: {
      ...sect,
      sect: {
        ...sect.sect,
        members: updatedMembers
      }
    }
  };
};

/**
 * Находит связанного торговца на основе имени секты и возвращает его ID
 * @param {String} sectName - название секты
 * @param {Array} merchants - массив торговцев
 * @returns {Number|null} ID торговца, связанного с сектой, или null
 */
const findRelatedMerchantId = (sectName, merchants) => {
  if (!sectName || !Array.isArray(merchants)) {
    return null;
  }
  
  // Простое соответствие по ключевым словам в названии
  const merchant = merchants.find(m => 
    m.name.includes(sectName) || 
    (m.affiliation && m.affiliation.includes(sectName))
  );
  
  return merchant ? merchant.id : null;
};

/**
 * Выполняет полную двустороннюю синхронизацию между лояльностью секты/членов секты и социальными отношениями игрока
 * @param {Object} state - Текущее состояние игры
 * @returns {Object} - Обновленное состояние игры
 */
const syncSectRelationships = (state) => {
  // Используем прямые обновления через updateRelationshipAndLoyalty
  // вместо двойной синхронизации
  
  console.log(`🔄 Синхронизация отношений отключена. Используйте updateRelationshipAndLoyalty для прямого обновления`);
  
  // Просто возвращаем состояние без изменений, так как вся синхронизация 
  // должна происходить через непосредственное обновление значений
  return state;
};

/**
 * Синхронизирует отдельный член секты с социальными отношениями или наоборот
 * @param {Object} member - член секты
 * @param {Array} relationships - массив социальных отношений
 * @param {boolean} updateLoyalty - если true, обновляем лояльность члена, иначе обновляем отношения
 * @returns {Object} объект с обновленным членом секты и/или отношениями
 */
const syncSingleMember = (member, relationships, updateLoyalty = true) => {
  if (!member || !member.name || !Array.isArray(relationships)) {
    return { member, relationships };
  }
  
  // Находим соответствующее отношение
  const relationIndex = relationships.findIndex(rel => rel.name === member.name);
  
  // Если updateLoyalty = true, обновляем лояльность члена секты на основе отношений
  // Если updateLoyalty = false, обновляем отношения на основе лояльности члена секты
  if (updateLoyalty) {
    // Обновляем лояльность на основе отношений
    if (relationIndex >= 0 && relationships[relationIndex].level !== undefined) {
      return {
        member: { ...member, loyalty: relationships[relationIndex].level },
        relationships
      };
    }
  } else {
    // Обновляем отношения на основе лояльности
    const updatedRelationships = [...relationships];
    
    if (relationIndex >= 0) {
      // Обновляем существующее отношение
      updatedRelationships[relationIndex] = {
        ...updatedRelationships[relationIndex],
        level: member.loyalty || 0,
        lastUpdated: Date.now()
      };
    } else {
      // Создаем новое отношение
      updatedRelationships.push({
        id: `sect_member_${member.id || Date.now()}`,
        name: member.name,
        type: 'sect_member',
        role: member.role || 'Член секты',
        level: member.loyalty || 0,
        lastUpdated: Date.now()
      });
    }
    
    return { member, relationships: updatedRelationships };
  }
  
  // Если ничего не изменилось
  return { member, relationships };
};

/**
 * Обновляет значение лояльности/уровня отношений одновременно в обоих местах:
 * в данных секты и в социальных отношениях
 * @param {Object} state - Текущее состояние игры
 * @param {String} name - Имя персонажа (члена секты или самой секты)
 * @param {Number} newValue - Новое значение лояльности/уровня отношений
 * @returns {Object} - Обновленное состояние игры
 */
const updateRelationshipAndLoyalty = (state, name, newValue) => {
  // Проверка входных данных
  if (!state || !name || newValue === undefined || newValue === null) {
    console.warn('⚠️ Невозможно обновить отношения/лояльность: неполные данные');
    return state;
  }
  
  console.log(`🔄 Прямое обновление отношений для "${name}" до уровня ${newValue}`);
  
  // Создаем новый state
  let newState = {...state};
  
  // Обновляем значение в секте только для членов секты
  if (newState.sect && newState.sect.sect) {
    
    // Если есть члены секты, проверяем, есть ли среди них персонаж с таким именем
    if (newState.sect.sect.members && Array.isArray(newState.sect.sect.members)) {
      const memberIndex = newState.sect.sect.members.findIndex(m => m.name === name);
      if (memberIndex !== -1) {
        // Обновляем лояльность члена секты
        console.log(`✅ Обновлена лояльность члена секты "${name}" до ${newValue}`);
        const updatedMembers = [...newState.sect.sect.members];
        updatedMembers[memberIndex] = {
          ...updatedMembers[memberIndex],
          loyalty: newValue
        };
        
        newState = {
          ...newState,
          sect: {
            ...newState.sect,
            sect: {
              ...newState.sect.sect,
              members: updatedMembers
            }
          }
        };
      }
    }
  }
  
  // Обновляем значение в социальных отношениях
  if (newState.player && newState.player.social) {
    // Обрабатываем случай, когда relationships - это массив (новый формат)
    if (Array.isArray(newState.player.social.relationships)) {
      const relationIndex = newState.player.social.relationships.findIndex(r => r.name === name);
      if (relationIndex !== -1) {
        // Обновляем уровень отношений
        console.log(`✅ Обновлены социальные отношения с "${name}" до уровня ${newValue}`);
        const updatedRelationships = [...newState.player.social.relationships];
        updatedRelationships[relationIndex] = {
          ...updatedRelationships[relationIndex],
          level: newValue,
          lastUpdated: Date.now()
        };
        
        newState = {
          ...newState,
          player: {
            ...newState.player,
            social: {
              ...newState.player.social,
              relationships: updatedRelationships
            }
          }
        };
      } else {
        // Если отношения не существуют, но это секта или член секты, создаем новую запись
        if (
          (newState.sect && newState.sect.sect && newState.sect.sect.name === name) ||
          (newState.sect && newState.sect.sect && newState.sect.sect.members && 
           newState.sect.sect.members.some(m => m.name === name))
        ) {
          // Определяем, секта это или член секты
          const isSect = newState.sect.sect.name === name;
          const role = isSect ? 'Секта' : 'Член секты';
          
          // Создаем новую запись отношений
          const newRelationship = {
            id: `relation_${Date.now()}`,
            name: name,
            role: role,
            level: newValue,
            lastUpdated: Date.now(),
            events: isSect ? [`Вы присоединились к секте "${name}"`] : []
          };
          
          console.log(`✅ Создана новая запись социальных отношений с "${name}" с уровнем ${newValue}`);
          
          // Добавляем новое отношение
          newState = {
            ...newState,
            player: {
              ...newState.player,
              social: {
                ...newState.player.social,
                relationships: [...newState.player.social.relationships, newRelationship]
              }
            }
          };
        }
      }
    }
  }
  
  // Также обновляем relationships в player (для обратной совместимости)
  if (newState.player && Array.isArray(newState.player.relationships)) {
    const relationIndex = newState.player.relationships.findIndex(r => r.name === name);
    if (relationIndex !== -1) {
      const updatedRelationships = [...newState.player.relationships];
      updatedRelationships[relationIndex] = {
        ...updatedRelationships[relationIndex],
        level: newValue,
        lastUpdated: Date.now()
      };
      
      newState = {
        ...newState,
        player: {
          ...newState.player,
          relationships: updatedRelationships
        }
      };
    }
  }
  
  return newState;
};

/**
 * Инициализирует систему прямого обновления отношений между сектой и социальными отношениями
 * @param {Object} context - Объект контекста с методами getState и dispatch
 */
const initRelationshipSync = (context) => {
  // Проверяем, что контекст предоставляет необходимые методы
  if (!context || typeof context.getState !== 'function' || typeof context.dispatch !== 'function') {
    console.error('❌ Ошибка: initRelationshipSync вызван с некорректным контекстом');
    return;
  }
  
  console.log('✅ Система прямого обновления отношений готова. Автоматическая синхронизация отключена.');
};

/**
 * Функция-обертка для интеграции системы прямого обновления отношений с GameContextProvider
 * @param {Function} GameContextProvider - Оригинальный компонент-провайдер контекста
 * @returns {Function} - Обернутый компонент-провайдер с прямым обновлением отношений
 */
const integrateRelationshipSyncer = (GameContextProvider) => {
  // Возвращаем функциональный компонент-обертку
  return function EnhancedGameContextProvider(props) {
    // Упрощенная интеграция без автоматической синхронизации
    console.log('✅ Система прямого обновления отношений подключена');
    
    // Рендерим оригинальный GameContextProvider с полученными свойствами
    return React.createElement(GameContextProvider, props);
  };
};

// Экспортируем функции
module.exports = {
  calculateMerchantDiscount,
  applyLoyaltyDiscount,
  syncSectRelationships,
  syncRelationshipsFromLoyalty,
  syncLoyaltyFromRelationships,
  syncSectRelationshipToSocial,
  syncSocialToSectRelationship,
  findRelatedMerchantId,
  syncSingleMember,
  initRelationshipSync,
  updateRelationshipAndLoyalty,
  integrateRelationshipSyncer
};
