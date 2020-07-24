import { LinkerState, LinkerActionTypes } from '../store/types';

export const linker = (
  state: LinkerState,
  action: LinkerActionTypes,
): LinkerState => {
  switch (action.type) {
    case 'INIT_LINKER':
      break;
    case 'LINK_LINKER':
      break;
    case 'UNLINK_LINKER':
      break;
    case 'CLOSE_LINKER':
      break;
  }
  return state;
};
