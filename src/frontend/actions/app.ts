/** @format */

import { PtmTab, AppActionTypes } from '../store/types';
import { requestBackend } from '../utility';

export const init = (): any => {
  return async (dispatch: any, getState: any): Promise<void> => {
    dispatch(startLoading());
    const [rootFolders, projects] = await Promise.all([
      new Promise((resolve) => {
        chrome.bookmarks.getSubTree('0', (bookmarks) => {
          const rootFolders = bookmarks[0].children;
          resolve(rootFolders);
        });
      }),
      requestBackend('getProjects', {}),
    ]);
    console.log(rootFolders, projects);
    const { app } = getState();
    app.options.rootFolders = rootFolders;
    app.projects = projects;
    app.controls.selectedTab = PtmTab.SESSIONS;
    dispatch(initApp());
  };
};

export const initApp = (): AppActionTypes => {
  return {
    type: 'INIT',
  };
};

export const reloadApp = (): AppActionTypes => {
  return {
    type: 'RELOAD_APP',
  };
};

export const startLoading = (): AppActionTypes => {
  return {
    type: 'START_LOADING_APP',
  };
};

export const openBookmarksApp = (): AppActionTypes => {
  return {
    type: 'OPEN_BOOKMARKS_APP',
  };
};

export const openHelpApp = (): AppActionTypes => {
  return {
    type: 'OPEN_HELP_APP',
  };
};

export const searchApp = (query: string): AppActionTypes => {
  return {
    type: 'SEARCH_APP',
    query,
  };
};

export const changeTabApp = (selectedTab: number): AppActionTypes => {
  return {
    type: 'CHANGE_TAB_APP',
    selectedTab,
  };
};
