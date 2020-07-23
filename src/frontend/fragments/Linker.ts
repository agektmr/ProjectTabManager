import { html } from 'lit-html';
import { l10n } from '../ChromeL10N';
import { LinkerState } from '../../types/types';
import '../components/ptm-project-linker';

const onLink = (e: CustomEvent) => {

};

const onUnlink = (e: CustomEvent) => {

};

const onClose = (e: CustomEvent) => {

};

export const Linker = (state: LinkerState) => {
  return html`
    <style>
      /* h2 {
        width: 180px;
      }
      iron-icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        flex: 1 1 16px;
      }
      paper-dialog-scrollable {
        margin-top: 10px;
        padding: 0 16px;
      }
      paper-dialog {
        font-size: 1.0em;
        margin: 0 20px;
        max-width: none;
      }
      paper-item {
        cursor: pointer;
        font-size: 1.0em;
        padding: 0 16px;
        margin: 0;
        background-color: var(--default-background-color);
        min-height: 24px;
        line-height: 16px;
        display: flex;
      }
      paper-item:not([disabled]):hover {
        background-color: var(--primary-background-color);
      }
      paper-item[disabled] {
        cursor: auto;
        color: var(--disabled-text-color);
      } */
      .title {
        cursor: pointer;
        color: var(--secondary-text-color);
      }
      /* paper-button {
        color: var(--text-primary-color);
        background-color: var(--default-primary-color);
      } */
      ptm-list-item {
        --mdc-list-side-padding: 0;
      }
    </style>
    <mwc-dialog id="dialog" heading="${l10n('link_session_to_a_project')}">
      <mwc-list>
        ${state.projects.map(project => !!project.projectId ? html`
        <ptm-list-item
          @click="${onLink}"
          ?data-session="${!!project.winId}"
          data-project-id="${project.id}"
          hasMeta>
          <span class="title">${project.title}</span>
          <mwc-icon-button slot="meta">
            ${!!project.winId ? html`<img src="../img/link.svg">`:``}
          </mwc-icon-button>
        </ptm-list-item>`:'')}
      </mwc-list>
      <mwc-button slot="secondaryAction" @click="${onClose}">
        ${l10n('cancel')}
      </mwc-button>
      ${state.linkingProjectId ? html`
      <mwc-button slot="primaryAction" @click="${onUnlink}">
        ${l10n('unlink')}
      </mwc-button>`:''}
    </mwc-dialog>`;
};
