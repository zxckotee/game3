/**
 * Действия для работы с духовными питомцами
 */
import ACTION_TYPES from './actionTypes';
import spiritPetService from '../../services/spirit-pet-service';

/**
 * Загрузка питомцев пользователя
 * @param {string} userId - ID пользователя
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const loadSpiritPets = (userId) => async (dispatch) => {
  dispatch({ type: ACTION_TYPES.LOAD_SPIRIT_PETS_REQUEST });
  
  try {
    // Set a timeout to ensure the loading state is not stuck
    const timeoutId = setTimeout(() => {
      dispatch({
        type: ACTION_TYPES.LOAD_SPIRIT_PETS_FAILURE,
        payload: "Превышено время ожидания загрузки"
      });
    }, 5000); // 5 second timeout
    
    const pets = await spiritPetService.getPetsByUserId(userId);
    const activePet = await spiritPetService.getActivePet(userId);
    
    // Clear the timeout as the operation completed successfully
    clearTimeout(timeoutId);
    
    dispatch({
      type: ACTION_TYPES.LOAD_SPIRIT_PETS_SUCCESS,
      payload: {
        pets,
        activePetId: activePet ? activePet.id : null
      }
    });
    
    return { success: true, pets, activePet };
  } catch (error) {
    console.error('Ошибка при загрузке питомцев:', error);
    
    dispatch({
      type: ACTION_TYPES.LOAD_SPIRIT_PETS_FAILURE,
      payload: error.message || "Ошибка при загрузке питомцев"
    });
    
    return { success: false, error: error.message || "Ошибка при загрузке питомцев" };
  }
};

/**
 * Добавление нового питомца
 * @param {Object} petData - Данные питомца
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const addSpiritPet = (petData) => async (dispatch) => {
  try {
    const newPet = await spiritPetService.createPet(petData);
    
    dispatch({
      type: ACTION_TYPES.ADD_SPIRIT_PET,
      payload: newPet
    });
    
    return { success: true, pet: newPet };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Удаление питомца
 * @param {string} petId - ID питомца
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const removeSpiritPet = (petId) => async (dispatch) => {
  try {
    const result = await spiritPetService.deletePet(petId);
    
    if (result) {
      dispatch({
        type: ACTION_TYPES.REMOVE_SPIRIT_PET,
        payload: petId
      });
    }
    
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Обновление питомца
 * @param {string} petId - ID питомца
 * @param {Object} updates - Обновляемые данные
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const updateSpiritPet = (petId, updates) => async (dispatch) => {
  try {
    const updatedPet = await spiritPetService.updatePet(petId, updates);
    
    if (updatedPet) {
      dispatch({
        type: ACTION_TYPES.UPDATE_SPIRIT_PET,
        payload: { id: petId, updates }
      });
    }
    
    return { success: !!updatedPet, pet: updatedPet };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Установка активного питомца
 * @param {string} userId - ID пользователя
 * @param {string} petId - ID питомца
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const setActiveSpiritPet = (userId, petId) => async (dispatch) => {
  try {
    const activatedPet = await spiritPetService.activatePet(userId, petId);
    
    if (activatedPet) {
      dispatch({
        type: ACTION_TYPES.SET_ACTIVE_SPIRIT_PET,
        payload: petId
      });
    }
    
    return { success: !!activatedPet, pet: activatedPet };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Кормление питомца
 * @param {string} petId - ID питомца
 * @param {Object} foodItem - Предмет еды
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const feedPet = (petId, foodItem) => async (dispatch) => {
  try {
    const updatedPet = await spiritPetService.feedPet(petId, foodItem);
    
    if (updatedPet) {
      dispatch({
        type: ACTION_TYPES.FEED_SPIRIT_PET,
        payload: { petId, foodItem }
      });
    }
    
    return { success: !!updatedPet, pet: updatedPet };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Тренировка питомца
 * @param {string} petId - ID питомца
 * @param {string} statToTrain - Характеристика для тренировки
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const trainPet = (petId, statToTrain) => async (dispatch) => {
  try {
    const updatedPet = await spiritPetService.trainPet(petId, statToTrain);
    
    if (updatedPet) {
      dispatch({
        type: ACTION_TYPES.TRAIN_SPIRIT_PET,
        payload: { petId, statToTrain }
      });
    }
    
    return { success: !!updatedPet, pet: updatedPet };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Использование способности питомца
 * @param {string} userId - ID пользователя
 * @param {string} abilityId - ID способности
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const usePetAbility = (userId, abilityId) => async (dispatch) => {
  try {
    const result = await spiritPetService.usePetAbility(userId, abilityId);
    
    if (result.success) {
      const { pet, ability } = result;
      dispatch({
        type: ACTION_TYPES.USE_PET_ABILITY,
        payload: { petId: pet.id, abilityId, energyCost: ability.energyCost }
      });
    }
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Приручение нового питомца
 * @param {string} userId - ID пользователя
 * @param {string} location - Локация
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const tamePet = (userId, location) => async (dispatch) => {
  try {
    const tamedPet = await spiritPetService.tamePetInLocation(userId, location);
    
    if (tamedPet) {
      dispatch({
        type: ACTION_TYPES.ADD_SPIRIT_PET,
        payload: tamedPet
      });
    }
    
    return { success: !!tamedPet, pet: tamedPet };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Обновление состояния всех питомцев пользователя
 * @param {string} userId - ID пользователя
 * @returns {Function} - Функция thunk для диспатча действий
 */
export const updatePetsState = (userId) => async (dispatch) => {
  try {
    const updatedPets = await spiritPetService.updatePetsState(userId);
    
    dispatch({
      type: ACTION_TYPES.UPDATE_PETS_STATE,
      payload: { pets: updatedPets }
    });
    
    return { success: true, pets: updatedPets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Получение боевых бонусов от активного питомца
 * @param {string} userId - ID пользователя
 * @returns {Function} - Функция thunk для получения бонусов
 */
export const getActivePetCombatBonus = (userId) => async () => {
  try {
    const bonuses = await spiritPetService.getActivePetCombatBonus(userId);
    return { success: true, bonuses };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Получение бонусов к характеристикам от активного питомца
 * @param {string} userId - ID пользователя
 * @returns {Function} - Функция thunk для получения бонусов
 */
export const getActivePetStatBonus = (userId) => async () => {
  try {
    const bonuses = await spiritPetService.getActivePetStatBonus(userId);
    return { success: true, bonuses };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
