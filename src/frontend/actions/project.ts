import { ProjectActionTypes, TabActionTypes } from '../store/types';
import { requestBackend } from '../utility';

export const initProjects = (): ProjectActionTypes => {
  return {
    type: 'INIT'
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
    });
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