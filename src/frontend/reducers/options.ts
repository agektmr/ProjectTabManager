import { OptionsState, OptionsActionTypes, AppActionTypes } from '../store/types';

export const options = (
  state: OptionsState = {
    lazyLoad: true,
    rootName: 'ProjectTabManager',
    rootParentId: '0',
    rootFolders: [],
    maxSessions: -1,
    open: false,
  },
  action: OptionsActionTypes | AppActionTypes,
): OptionsState => {
  switch (action.type) {
    case 'OPEN_OPTIONS':
      state.open = true;
      return state;
    case 'SAVE_OPTIONS':
      state.open = false;
      return state;
    case 'CLOSE_OPTIONS':
      state.open = false;
      return state;
  }
  return state;
};
