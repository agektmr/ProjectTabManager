import { ControlsState, AppActionTypes } from '../store/types';

export const controls = (
  state: ControlsState = {
        query: '',
        labelText: '',
        selectedTab: 0,
      },
  action: AppActionTypes,
): ControlsState => {
  switch (action.type) {
    // case 'OPEN_MENU_APP':
    //   state.options.open = true;
    //   return state;
  }
  return state;
};
