import { ProjectState, ProjectActionTypes } from '../../types/types';
import { ProjectEntity } from '../../background/ProjectEntity';

export const projects = (
  state: ProjectState[] = [],
  action: ProjectActionTypes,
): ProjectState[] => {
  switch (action.type) {
  }
  return state;
};
