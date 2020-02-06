/**
Copyright 2020 Eiji Kitamura

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eiji Kitamura (agektmr@gmail.com)
**/

import { html, customElement, property } from 'lit-element';
import { PtmBase } from './ptm-base';
import { PtmProjectLinker } from './ptm-project-linker';
import { PtmOptions } from './ptm-options';
import { ProjectEntity } from '../ts/ProjectEntity';
import { l10n } from '../ts/ChromeL10N';
import { PtmDialogQueryString } from './ptm-dialog';
import { PaperToastElement } from '@polymer/paper-toast';
import { IronPagesElement } from '@polymer/iron-pages';
import { PaperMenuButton } from '@polymer/paper-menu-button';
import { IronMetaElement } from '@polymer/iron-meta';
import './ptm-dialog';
import './ptm-project-linker';
import './ptm-options';
import './ptm-session';
import './ptm-project';
import '@polymer/app-layout/app-layout.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-material/paper-material.js';
import '@polymer/paper-menu-button/paper-menu-button.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/paper-tabs/paper-tab.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-toast/paper-toast.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/notification-icons.js';
import '@polymer/iron-meta/iron-meta.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';

@customElement('ptm-app')
export class PtmApp extends PtmBase {
  @property({
    type: []
  })
  projects: ProjectEntity[] = []

  @property({
    type: Number
  })
  selected: number = 0

  @property({
    type: Boolean
  })
  shiftKey: boolean = false

  @property({
    type: String
  })
  toastText: string = ''

  @property({
    type: String
  })
  query: string = ''

  @property({
    type: Number
  })
  previousPage: number = 0

  @property({
    type: Array
  })
  searchResults: ProjectEntity[] = []

  @property({
    type: Number
  })
  activeWinId: number = 0

  @property({
    type: Object
  })
  toast: PaperToastElement | undefined

  @property({
    type: Object
  })
  pages: IronPagesElement | undefined

  @property({
    type: Object
  })
  menu: PaperMenuButton | undefined

  @property({
    type: Object
  })
  options: PtmOptions | undefined

  @property({
    type: Object
  })
  linker: PtmProjectLinker | undefined

  @property({
    type: Object
  })
  meta: IronMetaElement | undefined

  @property({
    type: Object
  })
  searchQuery: HTMLInputElement | undefined

  @property({
    type: Number
  })
  timer: number = -1

  render() {
    return html`
    <style>
      :host {
        display: block;
        overflow: hidden;
      }
      * {
        font-size: 1.0em;
      }
      *:focus {
        outline: none;
      }
      iron-pages {
        min-height: 400px;
        margin-top: 82px;
      }
      iron-pages section {
        overflow-y: scroll;
      }
      app-header {
        position: fixed;
        top: 0;
        left: 0;
        margin: 0;
        padding: 0;
        height: 82px;
        width: 100%;
        z-index: 2;
        background-color: var(--default-primary-color);
      }
      .toolbar-header {
        padding: 0 10px;
        height: 48px;
        display: flex;
        z-index: 2;
      }
      .toolbar-tabs {
        margin: 0;
        padding: 0;
        height: 34px;
      }
      paper-button {
        color: var(--text-primary-color);
        background-color: var(--default-primary-color);
      }
      paper-input {
        --paper-input-container-color:       rgba(255, 255, 255, 0.64);
        --paper-input-container-focus-color: rgba(255, 255, 255, 1);
        --paper-input-container-input-color: var(--default-background-color);
        flex: 1 1 auto;
      }
      paper-item {
        cursor: pointer;
        padding: 0 10px;
        background-color: var(--default-background-color);
        min-height: 24px;
        line-height: 16px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      paper-menu-button {
        margin: 0;
      }
      paper-menu-button paper-material {
        width: 130px;
      }
      paper-menu-button paper-icon-button {
        color: var(--text-primary-color);
        margin-left: 4px;
        width: 24px;
        height: 24px;
        padding: 2px 4px 4px 4px;
        flex: 1 1 24px;
      }
      paper-tabs {
        width: 100%;
        height: 33px;
        color: var(--text-primary-color);
        background-color: var(--default-primary-color);
      }
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 300px;
      }
      #dialog {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      * {
        --paper-font-subhead: {
          font-family: 'Roboto', 'Noto', sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;

          font-size: 1.0em;
          font-weight: 400;
          line-height: 16px;
        };

        --paper-font-caption: {
          font-family: 'Roboto', 'Noto', sans-serif;
          -webkit-font-smoothing: antialiased;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          font-size: 0.8em;
          font-weight: 400;
          letter-spacing: 0.011em;
          line-height: 10px;
        };
        --paper-input-container: {
          padding: 0;
          height: 42px;
        };
      }
    </style>
    <iron-meta id="meta" type="dialog"></iron-meta>
    <ptm-dialog></ptm-dialog>
    <ptm-options id="options"></ptm-options>
    <ptm-project-linker id="linker"
      .projects="${this.projects}"
      @link-project="${this.linkProject}"
      @unlink-project="${this.unlinkProject}"></ptm-project-linker>
    <app-header class="paper-header" shadow>
      <app-toolbar class="toolbar-header">
        <paper-input
          id="search"
          placeholder="Project Tab Manager"
          @input="${this.queryChanged}"
          value="${this.query}">
        </paper-input>
        <paper-menu-button
          id="menu"
          vertical-align="top"
          horizontal-align="right">
          <paper-icon-button
            icon="icons:more-vert"
            slot="dropdown-trigger"
            tabindex="-1">
          </paper-icon-button>
          <paper-material slot="dropdown-content">
            <paper-item
              @click="${this.reload}">
              ${l10n('reload')}
            </paper-item>
            <paper-item
              @click="${this.manageBookmarks}">
              ${l10n('manage_bookmarks')}
            </paper-item>
            <paper-item
              @click="${this.openSettings}">
              ${l10n('settings')}
            </paper-item>
            <paper-item
              @click="${this.openHelp}">
              ${l10n('help')}
            </paper-item>
          </paper-material>
        </paper-menu-button>
      </app-toolbar>
      <app-toolbar class="toolbar-tabs">
        <paper-tabs selected="${this.selected}" tabindex="-1" @selected-changed="${this.changeTab}">
          <paper-tab tabindex="-1">${l10n('sessions')}</paper-tab>
          <paper-tab tabindex="-1">${l10n('projects')}</paper-tab>
        </paper-tabs>
      </app-toolbar>
    </app-header>
    <iron-pages id="pages" selected="${this.selected}">
      <section>
        ${this.projects.map(project => {
        return !!project.session ? html`
        <ptm-session
          .fields="${project.fields}"
          project-id="${project.id}"
          session-id="${project.session.id}"
          win-id="${project.session?.winId}"
          session-title="${project.session.title}"
          project-title="${project.title}"
          @create-project="${this.createProject}"
          @link-clicked="${this.openLinker}"
          @open-clicked="${this.openProject}"
          @rename-clicked="${this.renameProject}"
          @remove-clicked="${this.removeSession}"
          ?expanded="${this.activeWinId === project.session?.winId}"
          tabindex="0">
        </ptm-session>`:'';
        })}
      </section>
      <section>
        ${this.projects.map(project => {
        return !!project.bookmark ? html`
        <ptm-project
          .fields="${project.fields}"
          project-id="${project.id}"
          project-title="${project.title}"
          win-id="${project.session?.winId}"
          @open-clicked="${this.openProject}"
          @rename-clicked="${this.renameProject}"
          @remove-clicked="${this.removeProject}">
        </ptm-project>`:'';
        })}
      </section>
      <section class="loading">
        <paper-spinner active></paper-spinner>
      </section>
      <section>
        ${this.searchResults.map(project => html`
        <ptm-project
          .fields="${project.fields}"
          project-id="${project.id}"
          project-title="${project.title}"
          @open-clicked="${this.openProject}"
          expanded="true">
        </ptm-project>`
        )}
      </section>
    </iron-pages>
    <paper-toast
      id="toast"
      duration="3000"
      text="${this.toastText}">
    </paper-toast>`;
  }

  public async firstUpdated() {
    this.toast = this.querySelector('#toast');
    this.pages = this.querySelector('#pages');
    this.menu = this.querySelector('#menu');
    this.options = this.querySelector('#options');
    this.linker = this.querySelector('#linker');
    this.meta = this.querySelector('#meta');
    this.searchQuery = this.querySelector('#search');
    // @ts-ignore
    this.addEventListener('show-toast', (e: CustomEvent) => {
      this.toastText = e.detail.text;
      this.toast?.show();
    });
    // @ts-ignore
    this.addEventListener('reload', this.reload);
    this.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.keyCode === 16) this.shiftKey = true;
    });
    this.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.keyCode === 16) this.shiftKey = false;
    });
    this.activeWinId = await this.command('getActiveWindowId');
    this.fire('reload');
  }

  public async reload(e: CustomEvent) {
    if (this.pages) this.pages.selected = 2;
    this.projects = await this.command('update');
    if (this.pages) this.pages.selected = this.selected;
    this.menu?.close();
  }

  public manageBookmarks(): void {
    this.command('openBookmarkEditWindow');
  }

  public openSettings(): void {
    this.options?.open();
    this.menu?.close();
  }

  public openHelp(): void {
    this.command('openHelp');
  }

  private getProjectFromId(
    projectId: string
  ): ProjectEntity | undefined {
    return this.projects.find(project => project.id === projectId);
  }

  private queryChanged(): void {
    this.query = this.searchQuery?.value || '';
    if (this.query.length === 0 && this.pages) {
      clearTimeout(this.timer);
      this.timer = -1;
      this.pages.selected = this.selected;
    } if (this.timer < 0) {
      this.timer = window.setTimeout(async () => {
        this.searchResults = await this.command('search', {
          query: this.query
        });
        // this.search(this.query);
        if (this.pages) this.pages.selected = 3;
        this.timer = -1;
      }, 300);
      if (this.pages) this.pages.selected = 2;
    }
  }

  private changeTab(e: CustomEvent) {
    this.selected = e.detail.value;
  }

  private openLinker(e: CustomEvent) {
    const project = this.getProjectFromId(e.detail.id);
    if (project) {
      this.linker?.open(e.detail.id, !!project.bookmark);
    } else {
      this.fire('show-toast', {
        text: l10n('project_to_link_not_found')
      });
    }
  }

  private async linkProject(
    e: CustomEvent
  ): Promise<void> {
    try {
      const result = await this.command('linkProject', e.detail);
      if (result) {
        this.fire('reload');
        this.fire('show-toast', {
          text: l10n('project_linked')
        });
      }
    } catch (e) {
      this.fire('show-toast', {
        text: l10n('failed_linking')
      });
    } finally {
      this.linker?.close();
    }
  }

  private async unlinkProject(
    e: CustomEvent
  ): Promise<void> {
    try {
      const result = await this.command('unlinkProject', e.detail);
      if (result) {
        this.fire('reload');
        this.fire('show-toast', {
          text: l10n('project_unlinked')
        });
        this.linker?.close();
      } else {
        this.fire('show-toast', {
          text: l10n('failed_unlinking')
        });
      }
    } catch (e) {
      this.fire('show-toast', {
        text: l10n('failed_unlinking')
      });
    }
  }

  private async openProject(
    e: CustomEvent
  ): Promise<void> {
    try {
      await this.command('openProject', {
        projectId: e.detail.id,
        closeCurrent: this.shiftKey
      });
    } catch (e) {
      this.fire('show-toast', {
        text: l10n('failed_opening')
      });
    }
  }

  private async createProject(
    e: CustomEvent
  ): Promise<void> {
    const project = this.getProjectFromId(e.detail.id);
    if (!project) {
      this.fire('show-toast', {
        // TODO: l10n-nize
        text: 'Failed creating a project'
      });
      return;
    }
    try {
      const qs: PtmDialogQueryString = {
        line1: l10n('new_project'),
        line2: l10n('save_project_notice'),
        answer: '',
        placeholder: l10n('new_project_name'),
        confirm: l10n('save'),
        cancel: l10n('cancel')
      };
      const projectName = await this.meta?.byKey('confirm').prompt(qs);
      await this.command('createProject', {
        projectId: project.id,
        title: projectName
      });
      this.fire('reload');
      this.fire('show-toast', {
        text: l10n('project_created')
      });
    } catch (e) {
      this.fire('show-toast', {
        text: 'Failed creating a project'
      });
    }
  }

  private async removeSession(
    e: CustomEvent
  ): Promise<void> {
    const qs: PtmDialogQueryString = {
      line1: l10n('remove_a_session'),
      line2: l10n('remove_session_notice'),
      confirm: 'OK',
      cancel: l10n('cancel')
    };
    await this.meta?.byKey('confirm').confirm(qs);
    try {
      await this.command('removeSession', {
        projectId: e.detail.id
      });
      this.fire('reload');
      this.fire('show-toast', {
        text: l10n('session_removed')
      });
    } catch(e) {
      this.fire('reload');
      this.fire('show-toast', {
        text: 'Failed to remove the session'
      });
    }
  }

  private async renameProject(
    e: CustomEvent
  ): Promise<void> {
    try {
      const project = this.getProjectFromId(e.detail.id);
      const qs: PtmDialogQueryString = {
        line1: l10n('rename_a_project'),
        line2: l10n('change_project_name_notice'),
        answer: project?.title,
        placeholder: l10n('new_project_name'),
        confirm: l10n('update'),
        cancel: l10n('cancel')
      };
      const projectName = await this.meta?.byKey('confirm').prompt(qs);
      await this.command('renameProject', {
        projectId: project?.id,
        title: projectName
      });
      this.fire('show-toast', {
        text: l10n('project_renamed')
      });
      this.fire('reload');
    } catch (e) {
      this.fire('show-toast', {
        // TODO: l10n-nize
        text: 'Failed renaming a project'
      });
    }
  }

  private async removeProject(
    e: CustomEvent
  ): Promise<void> {
    try {
      const qs: PtmDialogQueryString = {
        line1: l10n('remove_a_project'),
        line2: l10n('remove_project_notice'),
        confirm: 'OK',
        cancel: l10n('cancel')
      };
      await this.meta?.byKey('confirm').confirm(qs);
      await this.command('removeProject', {
        projectId: e.detail.id
      });
      this.fire('reload');
      this.fire('show-toast', {
        text: l10n('project_removed')
      });
    } catch (e) {
      this.fire('show-toast', {
        // TODO: l10n-nize
        text: 'Failed removing the project'
      });
    }
  }

  // private async toggleBookmark(
  //   e: CustomEvent
  // ): Promise<void> {
  //   let projectIndex = this.projects.findIndex(project => {
  //     return project.id === e.detail.projectId
  //   });
  //   if (projectIndex === -1) projectIndex = 0;
  //   let project = this.projects[projectIndex];

  //   let field = project?.fields?.[e.detail.fieldIndex];
  //   if (!field) {
  //     this.fire('show-toast', {
  //       text: l10n('bookmark_error')
  //     });
  //     return;
  //   }
  //   // let path = `projectManager.projects.${projectIndex}.fields.${e.detail.fieldIndex}.id`;
  //   if (!field.id) {
  //     const bookmark = await project.addBookmark(field.tabId);
  //     // this.set(path, bookmark.id);
  //     this.fire('show-toast', {
  //       text: l10n('bookmark_added')
  //     });
  //   } else {
  //     await project.removeBookmark(field.id);
  //     // this.set(path, '');
  //     this.fire('show-toast', {
  //       text: l10n('bookmark_removed')
  //     });
  //   }
  // }
};