import { html } from 'lit-html';

import '@material/mwc-dialog';
import '@material/mwc-button';
import '@material/mwc-textfield';

const onConfirmed = e => {

};

const onCanceled = e => {

};

export const Dialog = (dialog) => {
  return html`
    <mwc-dialog id="dialog" heading="${dialog.line1}">
      <div class="vertical-center">
        ${dialog.line2 ? html`<p>${dialog.line2}</p>`:''}
        ${this.isPrompt ? html`
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
