/** @format */

import { html } from 'lit-html';
import { l10n } from '../ChromeL10N';

import '@material/mwc-dialog';
import '@material/mwc-select';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-textfield';
import '@material/mwc-switch';
import '@material/mwc-button';

import { Switch } from '@material/mwc-switch';
import { Select } from '@material/mwc-select';
import { TextField } from '@material/mwc-textfield';
import { OptionsState } from '../store/types';
import { closeOptions, saveOptions } from '../actions/options';

const onClose = () => {
  closeOptions();
};

const onSave = () => {
  const rootParentId = document.querySelector('#rootParentId');
  const rootName = document.querySelector('#rootName');
  const lazyLoad = document.querySelector('#lazyLoad');
  const _maxSessions = document.querySelector('#maxSessions');
  const maxSessions = parseInt((<Select>_maxSessions)?.value) || undefined;
  saveOptions(
    (<Switch>lazyLoad)?.checked,
    (<TextField>rootName)?.value,
    (<Select>rootParentId)?.value,
    maxSessions,
  );
};

export const Options = (state: OptionsState) => {
  const rootParent = parseInt(state.rootParentId) - 1;
  const rootName = state.rootName || 'Project Tab Manager';
  return html` <mwc-dialog heading="${l10n('settings')}" ?open="${state.open}">
    <mwc-select id="rootParentId" label="${l10n('root_folder_location')}">
      ${state.rootFolders.map(
        (item, i) => html` <mwc-list-item
          value="${item.id}"
          ?selected="${rootParent === i}"
        >
          ${item.title}
        </mwc-list-item>`,
      )}
    </mwc-select>
    <mwc-textfield
      id="rootName"
      value="${rootName}"
      label="${l10n('root_folder_name')}"
    >
    </mwc-textfield>
    <p>${l10n('root_folder_location_help')}</p>
    <mwc-switch id="lazyLoad" ?checked="${state.lazyLoad}">
      ${l10n('disable_lazy_load')}
    </mwc-switch>
    <p>${l10n('disable_lazy_load_help')}</p>
    <mwc-select id="maxSessions" label="${l10n('maximum_sessions')}">
      <mwc-list-item value="-1" ?selected="${state.maxSessions === -1}">
        ${l10n('unlimited')}
      </mwc-list-item>
      <mwc-list-item value="5" ?selected="${state.maxSessions === 5}">
        5
      </mwc-list-item>
      <mwc-list-item value="10" ?selected="${state.maxSessions === 10}">
        10
      </mwc-list-item> </mwc-select
    ><br />
    <p>${l10n('maximum_sessions_help')}</p>
    <mwc-button @click="${onClose}" slot="secondaryAction">
      ${l10n('cancel')}
    </mwc-button>
    <mwc-button @click="${onSave}" slot="primaryAction">
      ${l10n('save')}
    </mwc-button>
  </mwc-dialog>`;
};
