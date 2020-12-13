/** @format */

import { ProjectState, ProjectActionTypes } from '../store/types';
import { ProjectEntity } from '../../background/ProjectEntity';

export const projects = (
  state: ProjectState[] = [],
  action: ProjectActionTypes,
): ProjectState[] => {
  let project: ProjectState | undefined;
  if ('projectId' in action) {
    project = state.find((p: ProjectState) => {
      return p.id === action.projectId;
    });
    if (!project) return state;
  }

  switch (action.type) {
    case 'LOAD_PROJECT':
      break;
    case 'EXPAND_PROJECT': {
      project.expanded = true;
      return state;
    }
    case 'COLLAPSE_PROJECT': {
      project.expanded = false;
      return state;
    }
    case 'START_LOADING_PROJECT':
      project.loading = true;
      return state;
    case 'OPEN_PROJECT':
      break;
    case 'REMOVE_PROJECT':
      break;
    case 'LINK_PROJECT':
      break;
    case 'CREATE_PROJECT':
      break;
    case 'RENAME_PROJECT':
      break;
  }
  return state;
};
