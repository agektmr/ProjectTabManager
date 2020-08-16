import { OptionsActionTypes } from '../store/types';

export const initOptions = (): OptionsActionTypes => {
  return {
    type: 'INIT',
  }
};

export const saveOptions = (
  lazyLoad?: boolean,
  rootName?: string,
  rootParentId?: string,
  maxSessions?: number,
): OptionsActionTypes => {
  return {
    type: 'SAVE_OPTIONS',
    lazyLoad,
    rootName,
    rootParentId,
    maxSessions,
  }
};

export const openOptions = (): OptionsActionTypes => {
  return {
    type: 'OPEN_OPTIONS'
  }
};

export const closeOptions = (): OptionsActionTypes => {
  return {
    type: 'CLOSE_OPTIONS'
  }
};