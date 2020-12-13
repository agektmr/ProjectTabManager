/** @format */

import { DialogActionTypes } from '../store/types';

export const initDialog = (): DialogActionTypes => {
  return {
    type: 'INIT',
  };
};

export const confirmDialog = (): DialogActionTypes => {
  return {
    type: 'CONFIRM_DIALOG',
  };
};

export const cancelDialog = (): DialogActionTypes => {
  return {
    type: 'CANCEL_DIALOG',
  };
};
