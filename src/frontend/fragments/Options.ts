import { html } from 'lit-html';
import { l10n } from '../ChromeL10N';

import '../components/ptm-dialog';

import { OptionsState } from '../../types/types';

const onClose = (e: CustomEvent) => {

};

const onSave = (e: CustomEvent) => {

};

export const Options = (state: OptionsState) => {
  const rootParent = parseInt(state.rootParentId) - 1;
  const rootName = state.rootName || 'Project Tab Manager';
  return html`
    <style>
      :host {
        font-size: 1.0em;
      }
      iron-icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
      paper-dialog {
        font-size: 1.0em;
        margin: 0 20px;
        max-width: none;
      }
      paper-item {
        cursor: pointer;
        padding: 0 16px;
        margin: 0;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      p {
        color: var(--secondary-text-color);
      }
      paper-button {
        color: var(--text-primary-color);
        background-color: var(--default-primary-color);
      }
      .accent {
        color: var(--text-primary-color);
        background-color: var(--accent-color);
      }
      .buttons {
        padding: 10px 5px 10px 10px;
      }
    </style>
    <mwc-dialog id="dialog" heading="${l10n('settings')}">
      <mwc-select
        id="root"
        label="${l10n('root_folder_location')}">
        ${state.rootFolders?.map((item, i) => html`
        <mwc-list-item
          ?selected="${rootParent === i}">
          ${item.title}
        </mwc-list-item>`)}
      </mwc-select>
      <mwc-textfield
        id="rootName"
        value="${rootName}"
        label="${l10n('root_folder_name')}">
      </mwc-textfield>
      <p>${l10n('root_folder_location_help')}</p>
      <mwc-switch id="lazyLoad" ?checked="${state.lazyLoad}">
        ${l10n('disable_lazy_load')}
      </mwc-switch>
      <p>${l10n('disable_lazy_load_help')}</p>
      <mwc-select id="max_sessions" label="${l10n('maximum_sessions')}">
        <mwc-list-item ?selected="${state.maxSessions === -1}">
          ${l10n('unlimited')}
        </mwc-list-item>
        <mwc-list-item ?selected="${state.maxSessions === 5}">
          5
        </mwc-list-item>
        <mwc-list-item ?selected="${state.maxSessions === 10}">
          10
        </mwc-list-item>
      </mwc-select><br/>
      <p>${l10n('maximum_sessions_help')}</p>
      <mwc-button @click="${onClose}" slot="secondaryAction">
        ${l10n('cancel')}
      </mwc-button>
      <mwc-button @click="${onSave}" slot="primaryAction">
        ${l10n('save')}
      </mwc-button>
    </mwc-dialog>`;
}
