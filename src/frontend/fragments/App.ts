import { html } from 'lit-html';

import '@material/mwc-top-app-bar-fixed';
import '@material/mwc-textfield';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';
import '@material/mwc-linear-progress';
import '@material/mwc-snackbar';

import { TextField } from '@material/mwc-textfield';
import {
  AppState,
  DialogState,
  LinkerState,
  OptionsState,
  ProjectState
} from '../store/types';
import { l10n } from '../ChromeL10N';
import { Dialog } from './Dialog';
import { Linker } from './Linker';
import { Menu } from './Menu';
import { Options } from './Options';
import { Project } from './Project';
import { store } from '../store/store';
import { changeTabApp, searchApp } from '../store/actions';

const onChangeTab = (e: CustomEvent) => {
  // TODO:
  const tabIndex = 0;
  store.dispatch(changeTabApp(tabIndex));
};

const queryChanged = (e: CustomEvent) => {
  // TODO: implement throttle
  const query = (<TextField>e.target).value;
  store.dispatch(searchApp(query));
};

export const App = (state: AppState) => {
  return html`
    ${Dialog(state.dialog)}
    ${Options(state.options)}
    ${Linker(state.linker)}
    <mwc-top-app-bar-fixed>
      <mwc-textfield
        id="search"
        slot="title"
        placeholder="Project Tab Manager"
        @keyup="${queryChanged}"
        value="${state.controls.query}"
        fullwidth>
      </mwc-textfield>
      ${Menu()}
      <mwc-tab-bar id="tabs" @MDCTabBar:activated="${onChangeTab}">
        <mwc-tab label="${l10n('sessions')}"></mwc-tab>
        <mwc-tab label="${l10n('projects')}"></mwc-tab>
      </mwc-tab-bar>
    </mwc-top-app-bar-fixed>
    <section>
      ${state.projects.map(project => Project(project))}
    </section>
    <mwc-snackbar
      id="toast"
      duration="3000"
      labelText="${state.controls.labelText}">
    </mwc-snackbar>`;
}
