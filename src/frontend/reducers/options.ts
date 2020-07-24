import { OptionsState, OptionsActionTypes } from '../store/types';

export const options = (
  state: OptionsState,
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
      break;
    case 'SAVE_OPTIONS':
      state.open = false;
      break;
    case 'CLOSE_OPTIONS':
      state.open = false;
      break;
  }
  return state;
};
