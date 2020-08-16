import { LinkerState, LinkerActionTypes, AppActionTypes } from '../store/types';

export const linker = (
  state: LinkerState,
  action: LinkerActionTypes | AppActionTypes,
): LinkerState => {
  switch (action.type) {
    case 'INIT':
      return {
        linkingProjectId: '',
        projects: [],
        open: false,
      }
    case 'LINK_LINKER':
      break;
    case 'UNLINK_LINKER':
      break;
    case 'CLOSE_LINKER':
      break;
  }
  return state;
};
