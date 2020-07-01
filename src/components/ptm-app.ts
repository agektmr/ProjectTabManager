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

import 'web-animations-js/web-animations-next-lite.min.js';
import { html, customElement, property } from 'lit-element';

import './ptm-dialog';
import './ptm-project-linker';
import './ptm-options';
import './ptm-list-item';
import './ptm-session';
import './ptm-project';
import '@polymer/iron-meta/iron-meta.js';
import '@polymer/iron-pages/iron-pages.js';
import '@material/mwc-top-app-bar-fixed';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';
import '@material/mwc-textfield';
import '@material/mwc-menu';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import '@material/mwc-linear-progress';

import { PtmBase } from './ptm-base';
import { PtmProjectLinker } from './ptm-project-linker';
import { PtmOptions } from './ptm-options';
import { ProjectEntity } from '../ts/ProjectEntity';
import { l10n } from '../ts/ChromeL10N';
import { PtmDialogQueryString } from './ptm-dialog';
import { IronPagesElement } from '@polymer/iron-pages';
import { IronMetaElement } from '@polymer/iron-meta';
import { Snackbar } from '@material/mwc-snackbar';
import { TabBar } from '@material/mwc-tab-bar';
import { Menu } from '@material/mwc-menu';
import { LinearProgress } from '@material/mwc-linear-progress';

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
  toast: Snackbar | undefined

  @property({
    type: Object
  })
  pages: IronPagesElement | undefined

  @property({
    type: Object
  })
  menu: Menu | undefined

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
  tabs: TabBar | undefined

  @property({
    type: Object
  })
  progress: LinearProgress | undefined

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
      }
      iron-pages section {
        overflow-y: scroll;
      }
      #menu {
        position: relative;
        margin-right: 8px;
      }
      mwc-textfield {
        height: 28px;
        --mdc-text-field-ink-color: white;
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
      /* #menu-list {
        width: 130px;
      } */
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
    <ptm-project-linker
      id="linker"
      .projects="${this.projects}"
      @link-project="${this.linkProject}"
      @unlink-project="${this.unlinkProject}"></ptm-project-linker>
    <mwc-top-app-bar-fixed>
      <mwc-textfield
        id="search"
        slot="title"
        placeholder="Project Tab Manager"
        @input="${this.queryChanged}"
        value="${this.query}"
        fullwidth>
      </mwc-textfield>
      <div id="menu" slot="actionItems">
        <mwc-icon-button
          id="menu-button">
          <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></g></svg>
        </mwc-icon-button>
        <mwc-menu id="menu-list">
          <ptm-list-item graphic="icon" @click="${this.reload}">
            <svg slot="graphic" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"></path></g></svg>
            ${l10n('reload')}
          </ptm-list-item>
          <ptm-list-item graphic="icon" @click="${this.manageBookmarks}">
            <svg slot="graphic" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 10l-2.5-1.5L15 12V4h5v8z"></path></g></svg>
            ${l10n('manage_bookmarks')}
          </ptm-list-item>
          <ptm-list-item graphic="icon" @click="${this.openSettings}">
            <svg slot="graphic" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></g></svg>
            ${l10n('settings')}
          </ptm-list-item>
          <ptm-list-item graphic="icon" @click="${this.openHelp}">
            <svg slot="graphic" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"></path></g></svg>
            ${l10n('help')}
          </ptm-list-item>
        </mwc-menu>
      </div>
      <mwc-tab-bar
        id="tabs"
        @MDCTabBar:activated="${this.changeTab}">
        <mwc-tab label="${l10n('sessions')}"></mwc-tab>
        <mwc-tab label="${l10n('projects')}"></mwc-tab>
      </mwc-tab-bar>
      <mwc-linear-progress id="progress" indeterminate></mwc-linear-progress>
    </mwc-top-app-bar-fixed>
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
    <mwc-snackbar
      id="toast"
      duration="3000"
      labelText="${this.toastText}">
    </mwc-snackbar>`;
  }

  public async firstUpdated() {
    this.toast = this.querySelector('#toast');
    this.pages = this.querySelector('#pages');
    this.menu = this.querySelector('#menu-list');
    this.options = this.querySelector('#options');
    this.linker = this.querySelector('#linker');
    this.meta = this.querySelector('#meta');
    this.tabs = this.querySelector('#tabs');
    this.progress = this.querySelector('#progress');
    this.searchQuery = this.querySelector('#search');

    const menuButton = this.querySelector('#menu-button');
    // @ts-ignore
    this.menu.anchor = menuButton;
    menuButton.addEventListener('click', () => {
      // @ts-ignore
      this.menu.open = true;
    });

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
    this.showLoading();
    this.projects = await this.command('update');
    this.hideLoading();
    this.selected = this.tabs?.activeIndex || 0;
    this.menu?.close();
  }

  private showLoading(): void {
    if (this.progress) this.progress.closed = false;
  }

  private hideLoading(): void {
    if (this.progress) this.progress.closed = true;
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
      this.hideLoading();
      this.selected = this.tabs?.activeIndex || 0;
    } if (this.timer < 0) {
      this.timer = window.setTimeout(async () => {
        this.searchResults = await this.command('search', {
          query: this.query
        });
        // this.search(this.query);
        this.hideLoading();
        this.selected = 2;
        this.timer = -1;
      }, 300);
      this.showLoading();
    }
  }

  private changeTab(e: CustomEvent) {
    this.selected = e.detail.index || 0;
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