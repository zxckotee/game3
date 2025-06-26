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
} from '../actions/types';

const initialState = {
  pets: [],
  activePetId: null,
  loading: false,
  error: null
};

const spiritPetsReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PETS_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };

    case FETCH_PETS_SUCCESS:
      return { 
        ...state, 
        pets: action.payload.pets, 
        activePetId: action.payload.activePetId,
        loading: false,
        error: null
      };

    case FETCH_PETS_FAILURE:
      return { 
        ...state, 
        error: action.payload, 
        loading: false 
      };

    case UPDATE_PET:
      return { 
        ...state, 
        pets: state.pets.map(pet => 
          pet.id === action.payload.id ? action.payload : pet
        )
      };

    case SET_ACTIVE_PET:
      return { 
        ...state, 
        activePetId: action.payload,
        pets: state.pets.map(pet => ({
          ...pet,
          isActive: pet.id === action.payload
        }))
      };

    case ADD_PET:
      return { 
        ...state, 
        pets: [...state.pets, action.payload] 
      };

    case FEED_PET_SUCCESS:
      return {
        ...state,
        pets: state.pets.map(pet => 
          pet.id === action.payload.id ? action.payload : pet
        )
      };

    case TRAIN_PET_SUCCESS:
      return {
        ...state,
        pets: state.pets.map(pet => 
          pet.id === action.payload.id ? action.payload : pet
        )
      };

    case CHECK_PETS_STATUS_SUCCESS:
      return {
        ...state,
        pets: state.pets.map(pet => {
          const updatedPet = action.payload.find(p => p.id === pet.id);
          return updatedPet ? updatedPet : pet;
        })
      };

    default:
      return state;
  }
};

export default spiritPetsReducer;