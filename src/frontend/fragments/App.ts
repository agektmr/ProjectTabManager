import { html } from 'lit-html';

import '@material/mwc-top-app-bar-fixed';
import '@material/mwc-textfield';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';
import '@material/mwc-linear-progress';
import '@material/mwc-snackbar';

import {
  AppState,
  DialogState,
  LinkerState,
  OptionsState,
  ProjectState
} from '../../types/types';
import { l10n } from '../ChromeL10N';
import { Dialog } from './Dialog';
import { Menu } from './Menu';
import { Linker } from './Linker';
import { Options } from './Options';
import { Project } from './Project';

const onChangeTab = (e: CustomEvent) => {

};

const queryChanged = (e: CustomEvent) => {

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