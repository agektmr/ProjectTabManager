import { LinkerState, LinkerActionTypes } from '../fragments/Linker';

export const linker = (
  state: LinkerState,
  action: LinkerActionTypes
): LinkerState => {
  switch (action.type) {
    case 'LINKER_LINK':
      break;
    case 'LINKER_UNLINK':
      break;
    case 'LINKER_CLOSE':
      break;
  }
  return state;
};
