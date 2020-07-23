import { html } from 'lit-html';
import { l10n } from '../ChromeL10N';

import '@material/mwc-list';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '../components/ptm-list-item';
import '../components/ptm-bookmark';

import { ProjectState } from '../../types/types';

const toggle = (e: CustomEvent) => {
  // Switch the status of `.expand` between `true` and `false`
  // At the same time, if `.fields` are not loaded, load them before `true`.
};

const openProject = (e: CustomEvent) => {
  // Open the project from background.
};

const onTapRemove = (e: CustomEvent) => {
  // Remove the project after confirmation.
  // Use the dialog to confirm.
};

const onTapLink = (e: CustomEvent) => {
  // Link the project to another project.
  // Use the linker to find the project to link to.
};

const onTapNewProject = (e: CustomEvent) => {
  // Create a new project.
  // Use the dialog to determine the name.
};

const onTapRename = (e: CustomEvent) => {
  // Rename the project.
  // Use the dialog to change the name.
};

const closeTab = (e: CustomEvent) => {

};

const addBookmark = (e: CustomEvent) => {
  // Add bookmark.
};

const removeBookmark = (e: CustomEvent) => {
  // Remove bookmark.
};

export const Project = (project: ProjectState) => {
  return html`
    <section>
    <style>
        .content {
          display: flex;
          align-items: center;
        }
        .title {
          cursor: pointer;
          color: var(--secondary-text-color);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          flex: 1 1 auto;
        }
        .title[active] {
          font-weight: bold;
          color: var(--primary-text-color);
        }
        .buttons {
          display: none;
          flex: 0 0 auto;
        }
        .content:hover .buttons {
          display: block;
        }
        mwc-list {
          height: 32px;
        }
        mwc-list[expanded] {
          height: auto;
        }
      </style>
      <mwc-list ?expanded="${project.expanded}">
        <ptm-list-item graphic="avatar" ?focused="${project.focused}">
          <mwc-icon-button-toggle
            slot="graphic"
            ?on=${project.expanded}
            @click="${toggle}">
            <svg slot="onIcon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></g></svg>
            <svg slot="offIcon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path></g></svg>
          </mwc-icon-button-toggle>
          <div class="content">
            <div
              class="title"
              @click="${openProject}"
              ?active="${!!project.winId}">
              <span>${project.title}</span>
            </div>
            <div class="buttons">
              ${!project.winId ? html`
              <mwc-icon-button
                @click="${onTapRemove}"
                title="${l10n('remove')}">
                <img src="../img/delete.svg">
              </mwc-icon-button>`:''}
              <mwc-icon-button
                @click="${onTapLink}"
                title="${l10n('link_session_to_a_project')}">
                <img src="../img/link.svg">
              </mwc-icon-button>
              ${project.id.indexOf('-') === -1 ? html`
              <mwc-icon-button
                @click="${onTapRename}"
                title="${l10n('edit')}">
                <img src="../img/create.svg">
              </mwc-icon-button>`:html`
              <mwc-icon-button
                @click="${onTapNewProject}"
                title="${l10n('create_a_new_project')}">
                <img src="../img/folder-special.svg">
              </mwc-icon-button>`}
            </div>
          </div>
        </ptm-list-item>
        <mwc-linear-progress
          ?indeterminate="${project.loading}"></mwc-linear-progress>
        <iron-collapse id="collapse" ?opened="${project.expanded}">
          ${!project.fields.length ? html`
          <ptm-list-item graphic="icon">
            <mwc-icon-button
              slot="graphic">
              <img src="../img/warning.svg">
            </mwc-icon-button>
            <span class="title">${l10n('no_tabs')}</span>
          </ptm-list-item>
          `:''}
          ${project.fields.map((field, index) => html`
          <ptm-bookmark
            index="${index}"
            url="${field.url}"
            fav-icon-url="${field.favIconUrl}"
            bookmark-id="${field.bookmarkId || ''}"
            tab-id="${field.tabId || ''}"
            site-title="${field.title}"
            project-id="${project.id}"
            @add-bookmark="${addBookmark}"
            @remove-bookmark="${removeBookmark}">
          </ptm-bookmark>`)}
        </iron-collapse>
      </mwc-list>
    </section>`;
};
