import { html } from 'lit-html';

import { l10n } from '../ChromeL10N';
import { Dialog } from './Dialog';
import { Menu } from './Menu';
import { Linker } from './Linker';
import { Options } from './Options';
import { Project } from './Project';

const onChangeTab = e => {

};

const queryChanged = e => {

};

export const App = (state) => {
  return html`
    ${Dialog(state.dialog)}
    ${Options(state.dialog)}
    ${Linker(state.dialog)}
    <mwc-top-app-bar-fixed>
      <mwc-textfield
        id="search"
        slot="title"
        placeholder="Project Tab Manager"
        @keyup="${queryChanged}"
        value="${state.query}"
        fullwidth>
      </mwc-textfield>
      ${Menu()}
      <mwc-tab-bar id="tabs" @MDCTabBar:activated="${onChangeTab}">
        <mwc-tab label="${l10n('sessions')}"></mwc-tab>
        <mwc-tab label="${l10n('projects')}"></mwc-tab>
      </mwc-tab-bar>
      <mwc-linear-progress
        id="progress"
        ?indeterminate="${state.loading}"></mwc-linear-progress>
    </mwc-top-app-bar-fixed>
    <section>
      ${state.projects.map(project => Project(project))}
    </section>
    <mwc-snackbar
      id="toast"
      duration="3000"
      labelText="${state.toastText}">
    </mwc-snackbar>`;
}