/**
 * Утилита для синхронизации лояльности секты с социальными отношениями
 * и обратно - социальных отношений с лояльностью секты
 */

/**
 * Синхронизирует лояльность секты с социальными отношениями
 * @param {Array} relationships - массив социальных отношений игрока
 * @param {Object} sect - объект секты
 * @param {Number} sectLoyalty - уровень лояльности секты
 * @returns {Array} обновленный массив социальных отношений
 */
export const syncSectRelationshipToSocial = (relationships = [], sect, sectLoyalty) => {
  // Если нет секты или лояльности, возвращаем отношения без изменений
  if (!sect || sectLoyalty === undefined || sectLoyalty === null) {
    console.log('⚠️ Невозможно синхронизировать отношения с сектой: неполные данные о секте');
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
export const syncSocialToSectRelationship = (relationships = [], sect) => {
  // Если нет секты, синхронизация невозможна
  if (!sect) {
    console.log('⚠️ Невозможно синхронизировать лояльность: секта не найдена');
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
 * Рассчитывает скидку на основе лояльности/отношений
 * @param {Number} loyaltyLevel - уровень лояльности/отношений (0-100)
 * @returns {Number} размер скидки в процентах (0-10%)
 */
export const calculateDiscountPercentage = (loyaltyLevel) => {
  if (typeof loyaltyLevel !== 'number' || loyaltyLevel < 0) {
    return 0;
  }
  
  // Скидка: лояльность/10, максимум 10%
  const discount = Math.min(10, Math.floor(loyaltyLevel / 10));
  return discount;
};

/**
 * Применяет скидку к цене товара
 * @param {Number} price - начальная цена товара
 * @param {Number} loyaltyLevel - уровень лояльности/отношений (0-100)
 * @returns {Object} объект с обновленной ценой и процентом скидки
 */
export const applyLoyaltyDiscount = (price, loyaltyLevel) => {
  const discountPercentage = calculateDiscountPercentage(loyaltyLevel);
  
  if (discountPercentage <= 0) {
    return { finalPrice: price, discount: 0 };
  }
  
  const discountAmount = Math.floor(price * (discountPercentage / 100));
  const finalPrice = price - discountAmount;
  
  return {
    finalPrice,
    discount: discountPercentage
  };
};

/**
 * Находит связанного торговца на основе имени секты и возвращает его ID
 * @param {String} sectName - название секты
 * @param {Array} merchants - массив торговцев
 * @returns {Number|null} ID торговца, связанного с сектой, или null
 */
export const findRelatedMerchantId = (sectName, merchants) => {
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
