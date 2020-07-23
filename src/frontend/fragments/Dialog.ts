import { html } from 'lit-html';

import '@material/mwc-dialog';
import '@material/mwc-button';
import '@material/mwc-textfield';

export interface DialogState {
  line1: string
	line2?: string
  placeholder?: string
  answer?: string
  okay: string
  cancel: string
  isPrompt: boolean
  confirmed?: Function
  canceled?: Function
  open: boolean
}

interface DialogConfirmAction {
  type: 'DIALOG_CONFIRM'
}

interface DialogCancelAction {
  type: 'DIALOG_CANCEL'
}

export type DialogActionTypes =
  DialogConfirmAction |
  DialogCancelAction;

const onConfirmed = (e: CustomEvent) => {

};

const onCanceled = (e: CustomEvent) => {

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
