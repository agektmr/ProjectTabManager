import { DialogState, DialogActionTypes, AppActionTypes } from '../store/types';

export const dialog = (
  state: DialogState,
  action: DialogActionTypes | AppActionTypes
): DialogState => {
  switch (action.type) {
    case 'INIT':
      return {
        line1: '',
        okay: 'OK',
        cancel: 'Cancel',
        isPrompt: false,
        open: false,
      };
    case 'CONFIRM_DIALOG':
      break;
    case 'CANCEL_DIALOG':
      break;
  }
  return state;
};
