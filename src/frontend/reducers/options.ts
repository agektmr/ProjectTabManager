import { OptionsState, OptionsActionTypes } from '../store/types';

export const options = (
  state: OptionsState = {
    lazyLoad: true,
    rootName: 'ProjectTabManager',
    rootParentId: '0',
    rootFolders: [],
    maxSessions: -1,
    open: false,
  },
  action: OptionsActionTypes,
): OptionsState => {
  switch (action.type) {
    case 'INIT_OPTIONS':
      // TODO:
      Promise.all([
        new Promise((resolve) => {
          chrome.bookmarks.getSubTree('0', bookmarks => {
            const rootFolders = bookmarks[0].children;
            resolve(rootFolders);
          })
        })
      ]);
      break;
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
