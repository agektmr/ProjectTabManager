/** @format */

import {
  ProjectActionTypes,
  TabActionTypes,
  ProjectState,
} from '../store/types';
import { requestBackend } from '../utility';
import { ProjectEntity } from '../../background/ProjectEntity';

export const initProjects = (): ProjectActionTypes => {
  return {
    type: 'INIT',
  };
};

// TODO: Create reducer and define action for this
export const startLoadingProject = (projectId: string): ProjectActionTypes => {
  return {
    type: 'START_LOADING_PROJECT',
    projectId: projectId,
  };
};

export const loadProject = (projectId: string): any => {
  return async (dispatch: any, getState: any): Promise<void> => {
    dispatch(startLoadingProject(projectId));
    const project = await requestBackend('getProject', {
      projectId: projectId,
    });
    const { app } = getState();
    const _project = app.projects.find((p: ProjectState) => {
      return p.id === project.id;
    });
    if (_project) _project.fields = [...project.fields];
    console.log(project);
    dispatch(expandProject(projectId));
  };
};

export const expandProject = (projectId: string): ProjectActionTypes => {
  return {
    type: 'EXPAND_PROJECT',
    projectId: projectId,
  };
};

export const collapseProject = (projectId: string): ProjectActionTypes => {
  return {
    type: 'COLLAPSE_PROJECT',
    projectId: projectId,
  };
};

export const openProject = (
  winId?: number,
  projectId?: string,
): ProjectActionTypes => {
  return {
    type: 'OPEN_PROJECT',
    winId,
    projectId,
  };
};

export const removeProject = (projectId: string): ProjectActionTypes => {
  return {
    type: 'REMOVE_PROJECT',
    projectId,
  };
};

export const linkProject = (projectId: string): ProjectActionTypes => {
  return {
    type: 'LINK_PROJECT',
    projectId,
  };
};

export const createProject = (winId: number): ProjectActionTypes => {
  return {
    type: 'CREATE_PROJECT',
    winId,
  };
};

export const renameProject = (projectId: string): ProjectActionTypes => {
  return {
    type: 'RENAME_PROJECT',
    projectId,
  };
};

export const fetchProjects = (type: string, details: any): any => {
  return (dispatch: any) => {
    // TODO: display loading
    return requestBackend(type, details)
      .then((result) => dispatch(openProject(result)))
      .catch((error) => {
        // TODO: display error
      });
  };
};

export const closeTab = (tabId: number): TabActionTypes => {
  return {
    type: 'CLOSE_TAB',
    tabId,
  };
};

export const addBookmark = (tabId: number): TabActionTypes => {
  return {
    type: 'ADD_BOOKMARK',
    tabId,
  };
};

export const removeBookmark = (bookmarkId: string): TabActionTypes => {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmarkId,
  };
};
