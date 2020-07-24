import { html } from 'lit-html';

import '@material/mwc-dialog';
import '@material/mwc-button';
import '@material/mwc-textfield';

import { DialogState } from '../store/types';
import { confirmDialog, cancelDialog } from '../store/actions';

const onConfirmed = (e: CustomEvent) => {
  confirmDialog();
};

const onCanceled = (e: CustomEvent) => {
  cancelDialog();
};

export const Dialog = (dialog: DialogState) => {
  return html`
    <mwc-dialog id="dialog" heading="${dialog.line1}">
      <div class="vertical-center">
        ${dialog.line2 ? html`<p>${dialog.line2}</p>`:''}
        ${dialog.isPrompt ? html`
        <mwc-textfield
          id="input"
          value="${dialog.answer}"
          placeholder="${dialog.placeholder}"
          autofocus>
        </mwc-textfield>`:''}
      </div>
      <mwc-button slot="secondaryAction" @click="${onCanceled}">
        ${dialog.cancel}
      </mwc-button>
      <mwc-button slot="primaryAction" @click="${onConfirmed}">
        ${dialog.okay}
      </mwc-button>
    </mwc-dialog>`;
}
