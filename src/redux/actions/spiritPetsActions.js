import * as spiritPetService from '../../services/spirit-pet-service-api';
import { adaptPetFromServer } from '../../data/spirit-pets-adapter';
import {
  FETCH_PETS_REQUEST,
  FETCH_PETS_SUCCESS,
  FETCH_PETS_FAILURE,
  UPDATE_PET,
  SET_ACTIVE_PET,
  ADD_PET,
  FEED_PET_SUCCESS,
  TRAIN_PET_SUCCESS,
  CHECK_PETS_STATUS_SUCCESS
} from './types';

// Загрузка питомцев пользователя
export const fetchUserPets = () => async (dispatch) => {
  dispatch({ type: FETCH_PETS_REQUEST });
  
  try {
    const pets = await spiritPetService.fetchUserPets();
    const adaptedPets = pets.map(adaptPetFromServer);
    const activePet = adaptedPets.find(pet => pet.isActive);
    
    dispatch({ 
      type: FETCH_PETS_SUCCESS, 
      payload: { 
        pets: adaptedPets, 
        activePetId: activePet ? activePet.id : null 
      } 
    });

    return adaptedPets;
  } catch (error) {
    console.error('Ошибка при загрузке питомцев:', error);
    dispatch({ 
      type: FETCH_PETS_FAILURE, 
      payload: error.message || 'Не удалось загрузить питомцев' 
    });
    return [];
  }
};

// Активация питомца
export const activatePet = (petId) => async (dispatch, getState) => {
  try {
    const updatedPet = await spiritPetService.activatePet(petId);
    const adaptedPet = adaptPetFromServer(updatedPet);
    
    // Обновляем всех питомцев, чтобы деактивировать предыдущего активного
    dispatch({ type: SET_ACTIVE_PET, payload: adaptedPet.id });
    
    return adaptedPet;
  } catch (error) {
    console.error('Ошибка при активации питомца:', error);
    return null;
  }
};

// Кормление питомца
export const feedPet = (petId, foodItemId) => async (dispatch) => {
  try {
    const updatedPet = await spiritPetService.feedPet(petId, foodItemId);
    const adaptedPet = adaptPetFromServer(updatedPet);
    
    dispatch({ type: FEED_PET_SUCCESS, payload: adaptedPet });
    
    return adaptedPet;
  } catch (error) {
    console.error('Ошибка при кормлении питомца:', error);
    return null;
  }
};

// Тренировка питомца
export const trainPet = (petId, stat) => async (dispatch) => {
  try {
    const updatedPet = await spiritPetService.trainPet(petId, stat);
    const adaptedPet = adaptPetFromServer(updatedPet);
    
    dispatch({ type: TRAIN_PET_SUCCESS, payload: adaptedPet });
    
    return adaptedPet;
  } catch (error) {
    console.error('Ошибка при тренировке питомца:', error);
    return null;
  }
};

// Проверка статуса питомцев (голод, лояльность)
export const checkPetsStatus = () => async (dispatch) => {
  try {
    const updatedPets = await spiritPetService.checkPetsStatus();
    const adaptedPets = updatedPets.map(adaptPetFromServer);
    
    if (adaptedPets.length > 0) {
      dispatch({ type: CHECK_PETS_STATUS_SUCCESS, payload: adaptedPets });
    }
    
    return adaptedPets;
  } catch (error) {
    console.error('Ошибка при проверке статуса питомцев:', error);
    return [];
  }
};

// Получение нового питомца
export const acquirePet = (petTypeId) => async (dispatch) => {
  try {
    const newPet = await spiritPetService.acquirePet(petTypeId);
    const adaptedPet = adaptPetFromServer(newPet);
    
    dispatch({ type: ADD_PET, payload: adaptedPet });
    
    // Если питомец установлен как активный, обновляем активного питомца
    if (adaptedPet.isActive) {
      dispatch({ type: SET_ACTIVE_PET, payload: adaptedPet.id });
    }
    
    return adaptedPet;
  } catch (error) {
    console.error('Ошибка при получении нового питомца:', error);
    return null;
  }
};