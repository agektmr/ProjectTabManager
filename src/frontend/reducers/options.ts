import { OptionsState, OptionsActionTypes } from '../fragments/Options';

export const options = (
  state: OptionsState,
  action: OptionsActionTypes
): OptionsState => {
  switch (action.type) {
    case 'OPTIONS_SAVE':
      break;
    case 'OPTIONS_CLOSE':
      break;
  }
  return state;
};
