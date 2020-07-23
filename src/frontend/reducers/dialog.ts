import { DialogState, DialogActionTypes } from '../../types/types';

export const dialog = (
  state: DialogState,
  action: DialogActionTypes
): DialogState => {
  switch (action.type) {
    case 'CONFIRM_DIALOG':
      break;
    case 'CANCEL_DIALOG':
      break;
  }
  return state;
};
