import { LinkerState, LinkerActionTypes } from '../../types/types';

export const linker = (
  state: LinkerState,
  action: LinkerActionTypes,
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
