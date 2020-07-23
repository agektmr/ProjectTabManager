import { OptionsState, OptionsActionTypes } from '../../types/types';

export const options = (
  state: OptionsState,
  action: OptionsActionTypes,
): OptionsState => {
  switch (action.type) {
    case 'SAVE_OPTIONS':
      break;
    case 'CLOSE_OPTIONS':
      break;
  }
  return state;
};
