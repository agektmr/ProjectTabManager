import { LinkerState, LinkerActionTypes, AppActionTypes } from '../store/types';

export const linker = (
  state: LinkerState = {
    linkingProjectId: '',
    projects: [],
    open: false,
  },
  action: LinkerActionTypes | AppActionTypes,
): LinkerState => {
  switch (action.type) {
    case 'LINK_LINKER':
      break;
    case 'UNLINK_LINKER':
      break;
    case 'CLOSE_LINKER':
      break;
  }
  return state;
};
