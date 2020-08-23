import { AppState, AppActionTypes, DialogActionTypes, OptionsActionTypes, LinkerActionTypes, ProjectActionTypes } from '../store/types';
import { controls } from './controls';
import { dialog } from './dialog';
import { linker } from './linker';
import { options } from './options';
import { projects } from './projects';

const bound = {
  controls,
  options,
  linker,
  dialog,
  projects,
};

export const app = (
  state: AppState,
  action: AppActionTypes | DialogActionTypes | OptionsActionTypes | LinkerActionTypes | ProjectActionTypes,
): AppState => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        controls: controls(state.controls, action),
        options: options(state.options, action),
        linker: linker(state.linker, action),
        dialog: dialog(state.dialog, action),
        projects: projects(state.projects, action),
      };
    case 'CHANGE_TAB_APP':
      state.controls.selectedTab = action.selectedTab;
      return state;
    case 'OPEN_MENU_APP':
      // state.options.open = true;
      return state;
    default:
      const _action = { type: action.type };
      return {
        // @ts-ignore
        controls: controls(state?.controls, _action ),
        // @ts-ignore
        options: options(state?.options, _action),
        // @ts-ignore
        linker: linker(state?.linker, _action),
        // @ts-ignore
        dialog: dialog(state?.dialog, _action),
        // @ts-ignore
        projects: projects(state?.projects, _action),
      };
  }
};
