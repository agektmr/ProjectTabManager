import { PtmTab, ControlsState, AppActionTypes } from '../store/types';

export const controls = (
  state: ControlsState = {
        query: '',
        labelText: '',
        selectedTab: PtmTab.LOADING,
      },
  action: AppActionTypes,
): ControlsState => {
  return state;
};
