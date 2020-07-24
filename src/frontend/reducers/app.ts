import { AppState, AppActionTypes } from '../store/types';

export const controls = (
  state: AppState,
  action: AppActionTypes,
): AppState => {
  switch (action.type) {
    case 'INIT_APP':
      const controls = {
        query: '',
        labelText: '',
        selectedTab: 0
      };
      return { ...state, controls, }
  }
  return state;
};
