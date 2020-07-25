import { DialogState, DialogActionTypes } from '../store/types';

export const dialog = (
  state: DialogState = {
    line1: '',
    okay: 'OK',
    cancel: 'Cancel',
    isPrompt: false,
    open: false,
  },
  action: DialogActionTypes
): DialogState => {
  switch (action.type) {
    case 'INIT_DIALOG':
      break;
    case 'CONFIRM_DIALOG':
      break;
    case 'CANCEL_DIALOG':
      break;
  }
  return state;
};
