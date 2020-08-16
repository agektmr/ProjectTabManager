import { ProjectState, ProjectActionTypes, TabActionTypes, AppActionTypes } from '../store/types';
import { ProjectEntity } from '../../background/ProjectEntity';

export const projects = (
  state: ProjectState[] = [],
  action: ProjectActionTypes | TabActionTypes | AppActionTypes
  ,
): ProjectState[] => {
  switch (action.type) {
    case 'INIT':
      break;
    case 'TOGGLE_PROJECT':
      break;
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
