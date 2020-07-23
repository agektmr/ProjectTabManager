import { DialogState, DialogActionTypes } from '../fragments/Dialog';

export const dialog = (
  state: DialogState,
  action: DialogActionTypes
): DialogState => {
  switch (action.type) {
    case 'DIALOG_CONFIRM':
      break;
    case 'DIALOG_CANCEL':
      break;
  }
  return state;
};
