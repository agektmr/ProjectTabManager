import { AppActionTypes } from '../store/types';

export const initApp = (): AppActionTypes => {
  return {
    type: 'INIT'
  }
};

export const openMenuApp = (): AppActionTypes => {
  return {
    type: 'OPEN_MENU_APP'
  }
};

export const reloadApp = (): AppActionTypes => {
  return {
    type: 'RELOAD_APP'
  }
};

export const openBookmarksApp = (): AppActionTypes => {
  return {
    type: 'OPEN_BOOKMARKS_APP'
  }
};

export const openHelpApp = (): AppActionTypes => {
  return {
    type: 'OPEN_HELP_APP'
  }
};

export const searchApp = (
  query: string
): AppActionTypes => {
  return {
    type: 'SEARCH_APP',
    query,
  }
};

export const changeTabApp = (
  selectedTab: number
): AppActionTypes => {
  return {
    type: 'CHANGE_TAB_APP',
    selectedTab,
  }
};