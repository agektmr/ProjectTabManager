/** @format */

import { html } from 'lit-html';
import { l10n } from '../ChromeL10N';

import '@material/mwc-list';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '@polymer/iron-collapse';
import '../components/ptm-list-item';
import '../components/ptm-bookmark';

import { ProjectState } from '../store/types';
import {
  openProject,
  removeProject,
  renameProject,
  createProject,
  closeTab,
  addBookmark,
  removeBookmark,
  collapseProject,
  expandProject,
  loadProject,
} from '../actions/project';
import { openLinker } from '../actions/linker';
import { store } from '../store/store';

const onToggle = (e: MouseEvent): void => {
  // Switch the status of `.expand` between `true` and `false`
  // At the same time, if `.fields` are not loaded, load them before `true`.
  // @ts-ignore
  const opened = e.target.parentNode.parentNode.querySelector('iron-collapse')
    .opened;
  // @ts-ignore
  const projectId = e.target.dataset.projectId;
  if (opened) {
    store.dispatch(collapseProject(projectId));
  } else {
    // @ts-ignore
    if (e.target.dataset.fieldLength > 0) {
      store.dispatch(expandProject(projectId));
    } else {
      store.dispatch(loadProject(projectId));
    }
  }

  // TODO: Is this already open?
  // TODO: If closed, expand
  // TODO: When expanding, is `fields` filled?
  // TODO: If not, it should be filled by sending a request to the backend
  // TOOD: If it is, should it send a request to the backend?
};

const onOpenProject = (e: CustomEvent): void => {
  const _winId = (<HTMLElement>e.target).dataset.winId;
  const winId = _winId ? parseInt(_winId) : undefined;
  const projectId = (<HTMLElement>e.target).dataset.projectId;
  if (!projectId) {
    console.error('[Project.onOpenProject] Project id not found');
    return;
  }

  // Open a project or a session window.
  // TODO: I don't know why if I remove this line gets error.
  // @ts-ignore
  store.dispatch(openProject(winId, projectId));
};

const onRemoveProject = (e: CustomEvent) => {
  // Remove the project after confirmation.
  // Use the dialog to confirm.

  const projectId = (<HTMLElement>e.target).dataset.projectId;
  if (projectId) store.dispatch(removeProject(projectId));
};

const onLinkProject = (e: CustomEvent) => {
  // Link the project to another project.
  // Use the linker to find the project to link to.
  // const projectId = // TODO:
  // openLinker(projectId);
};

const onCreateProject = (e: CustomEvent) => {
  // Create a new project.
  // Use the dialog to determine the name.
  // const winId = // TODO:
  // store.dispatch(createProject(winId));
};

const onRenameProject = (e: CustomEvent) => {
  // Rename the project.
  // Use the dialog to change the name.
  // const projectId = // TODO:
  // store.dispatch(renameProject(projectId));
};

const onCloseTab = (e: CustomEvent) => {
  // const tabId = //TODO:
  // store.dispatch(closeTab(tabId));
};

const onAddBookmark = (e: CustomEvent) => {
  // Add bookmark.
  // const tabId = //TODO:
  // store.dispatch(addBookmark(tabId));
};

const onRemoveBookmark = (e: CustomEvent) => {
  // Remove bookmark.
  // const bookmarkId = //TODO:
  // store.dispatch(removeBookmark(bookmarkId));
};

export const Project = (project: ProjectState) => {
  return html` <mwc-list ?expanded="${project.expanded}">
    <ptm-list-item graphic="avatar" ?focused="${project.focused}">
      <mwc-icon-button-toggle
        slot="graphic"
        data-project-id="${project.id || ''}"
        data-fields-length="${project.fields.length}"
        ?on=${project.expanded}
        @click="${onToggle}"
      >
        <svg
          slot="onIcon"
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          style="pointer-events: none; display: block; width: 100%; height: 100%;"
        >
          <g><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></g>
        </svg>
        <svg
          slot="offIcon"
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          style="pointer-events: none; display: block; width: 100%; height: 100%;"
        >
          <g>
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path>
          </g>
        </svg>
      </mwc-icon-button-toggle>
      <div class="content">
        <div
          class="title"
          data-win-id="${project.winId || ''}"
          data-project-id="${project.projectId || ''}"
          @click="${onOpenProject}"
          ?active="${!!project.winId}"
        >
          <span>${project.title}</span>
        </div>
        <div class="buttons">
          ${!project.winId
            ? html` <mwc-icon-button
                @click="${onRemoveProject}"
                title="${l10n('remove')}"
              >
                <img src="../img/delete.svg" />
              </mwc-icon-button>`
            : ''}
          <mwc-icon-button
            @click="${onLinkProject}"
            title="${l10n('link_session_to_a_project')}"
          >
            <img src="../img/link.svg" />
          </mwc-icon-button>
          ${project.id.indexOf('-') === -1
            ? html` <mwc-icon-button
                @click="${onRenameProject}"
                title="${l10n('edit')}"
              >
                <img src="../img/create.svg" />
              </mwc-icon-button>`
            : html` <mwc-icon-button
                @click="${onCreateProject}"
                title="${l10n('create_a_new_project')}"
              >
                <img src="../img/folder-special.svg" />
              </mwc-icon-button>`}
        </div>
      </div>
    </ptm-list-item>
    <mwc-linear-progress
      ?indeterminate="${project.loading}"
    ></mwc-linear-progress>
    <iron-collapse ?opened="${project.expanded}">
      ${!project.fields.length
        ? html`
            <ptm-list-item graphic="icon">
              <mwc-icon-button slot="graphic">
                <img src="../img/warning.svg" />
              </mwc-icon-button>
              <span class="title">${l10n('no_tabs')}</span>
            </ptm-list-item>
          `
        : ''}
      ${project.fields.map(
        (field, index) => html` <ptm-bookmark
          index="${index}"
          url="${field.url}"
          fav-icon-url="${field.favIconUrl}"
          bookmark-id="${field.bookmarkId || ''}"
          tab-id="${field.tabId || ''}"
          site-title="${field.title}"
          project-id="${project.id}"
          @add-bookmark="${onAddBookmark}"
          @remove-bookmark="${onRemoveBookmark}"
        >
        </ptm-bookmark>`,
      )}
    </iron-collapse>
  </mwc-list>`;
};
