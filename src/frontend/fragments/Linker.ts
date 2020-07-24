import { html } from 'lit-html';

import '@material/mwc-dialog';
import '@material/mwc-list';
import '@material/mwc-button';
import '../components/ptm-list-item';

import { l10n } from '../ChromeL10N';
import { LinkerState } from '../store/types';
import {
  linkLinker,
  unlinkLinker,
  closeLinker
} from '../store/actions';
import { store } from '../store/store';

const onLinkProject = (e: CustomEvent) => {
  const projectId = (<HTMLElement>e.target).dataset.projectId;
  if (!projectId) return;
  store.dispatch(linkLinker(projectId));
};

const onUnlinkProject = (e: CustomEvent) => {
  store.dispatch(unlinkLinker());
};

const onCloseLinker = (e: CustomEvent) => {
  store.dispatch(closeLinker());
};

export const Linker = (state: LinkerState) => {
  return html`
    <style>
      .title {
        cursor: pointer;
        color: var(--secondary-text-color);
      }
      ptm-list-item {
        --mdc-list-side-padding: 0;
      }
    </style>
    <mwc-dialog id="dialog" heading="${l10n('link_session_to_a_project')}">
      <mwc-list>
        ${state.projects.map(project => !!project.projectId ? html`
        <ptm-list-item
          @click="${onLinkProject}"
          ${project.winId ? html`data-win-id="${project.winId}"`:``}
          data-project-id="${project.projectId}"
          hasMeta>
          <span class="title">${project.title}</span>
          ${!!project.winId ? html`
          <mwc-icon-button slot="meta">
            <img src="../img/link.svg">
          </mwc-icon-button>`:``}
        </ptm-list-item>`:'')}
      </mwc-list>
      <mwc-button slot="secondaryAction" @click="${onCloseLinker}">
        ${l10n('cancel')}
      </mwc-button>
      ${state.linkingProjectId ? html`
      <mwc-button slot="primaryAction" @click="${onUnlinkProject}">
        ${l10n('unlink')}
      </mwc-button>`:''}
    </mwc-dialog>`;
};
