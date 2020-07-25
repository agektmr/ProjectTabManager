import {
  DialogActionTypes,
  LinkerActionTypes,
  OptionsActionTypes,
  ProjectActionTypes,
  TabActionTypes,
  AppActionTypes,
} from './types';

const requestBackend = (
  commandName: string,
  commandDetail: any
): Promise<any> => {
  return new Promise((resolve, reject) =>
    chrome.runtime.sendMessage({
      command: commandName,
      detail: commandDetail
    }, response => {
      if (!response) {
        // result being `undefined` is safe
        resolve();
      } else if (response.error) {
        reject(response.error);
      } else {
        resolve(response.result)
      }
    })
  );
}

export const initDialog = (): DialogActionTypes => {
  return {
    type: 'INIT_DIALOG'
  }
};

export const confirmDialog = (): DialogActionTypes => {
  return {
    type: 'CONFIRM_DIALOG',
  }
};

export const cancelDialog = (): DialogActionTypes => {
  return {
    type: 'CANCEL_DIALOG',
  }
};

export const initLinker = (): LinkerActionTypes => {
  return {
    type: 'INIT_LINKER'
  }
};

export const openLinker = (
  projectId: string
): LinkerActionTypes => {
  return {
    type: 'OPEN_LINKER',
    projectId,
  }
};

export const linkLinker = (
  projectId: string
): LinkerActionTypes => {
  return {
    type: 'LINK_LINKER',
    projectId,
  }
};

export const unlinkLinker = (): LinkerActionTypes => {
  return {
    type: 'UNLINK_LINKER',
  }
};

export const closeLinker = (): LinkerActionTypes => {
  return {
    type: 'CLOSE_LINKER',
  }
};

export const initOptions = (): OptionsActionTypes => {
  return {
    type: 'INIT_OPTIONS',
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

export const initProjects = (): ProjectActionTypes => {
  return {
    type: 'INIT_PROJECTS'
  }
};

export const toggleProject = (): ProjectActionTypes => {
  return {
    type: 'TOGGLE_PROJECT'
  }
};

export const openProject = (
  winId?: number,
  projectId?: string,
): ProjectActionTypes => {
  return {
    type: 'OPEN_PROJECT',
    winId,
    projectId,
  }
};

export const removeProject = (
  projectId: string
): ProjectActionTypes => {
  return {
    type: 'REMOVE_PROJECT',
    projectId,
  }
};

export const linkProject = (
  projectId: string
): ProjectActionTypes => {
  return {
    type: 'LINK_PROJECT',
    projectId,
  }
};

export const createProject = (
  winId: number
): ProjectActionTypes => {
  return {
    type: 'CREATE_PROJECT',
    winId,
  }
};

export const renameProject = (
  projectId: string
): ProjectActionTypes => {
  return {
    type: 'RENAME_PROJECT',
    projectId,
  }
};

export const fetchProjects = (
  type: string,
  details: any,
): any => {
  return (dispatch: any) => {
    // TODO: display loading
    return requestBackend(type, details)
    .then(result =>
      dispatch(openProject(result)))
    .catch(error => {
      // TODO: display error
    })
  }
}

export const closeTab = (
  tabId: number
): TabActionTypes => {
  return {
    type: 'CLOSE_TAB',
    tabId,
  }
};

export const addBookmark = (
  tabId: number
): TabActionTypes => {
  return {
    type: 'ADD_BOOKMARK',
    tabId,
  }
};

export const removeBookmark = (
  bookmarkId: string,
): TabActionTypes => {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmarkId,
  }
}

export const initApp = (): AppActionTypes => {
  return {
    type: 'INIT_APP'
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
