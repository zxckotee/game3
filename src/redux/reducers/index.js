import { combineReducers } from 'redux';
import authReducer from './authReducer';
import gameReducer from './gameReducer';
import inventoryReducer from './inventoryReducer';
import spiritPetsReducer from './spiritPetsReducer';
// Импортируйте другие редьюсеры здесь

const rootReducer = combineReducers({
  auth: authReducer,
  game: gameReducer,
  inventory: inventoryReducer,
  spiritPets: spiritPetsReducer,
  // Добавьте другие редьюсеры здесь
});

export default rootReducer;