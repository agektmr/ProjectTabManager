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

import {
  html,
  css,
  customElement,
  property
} from 'lit-element';
import { PtmBase } from './ptm-base';
import { PtmProjectLinker } from './ptm-project-linker';
import { PtmOptions } from './ptm-options';
import { Util } from '../ts/Util';
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
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/paper-tabs/paper-tab.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-toast/paper-toast.js';
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
    type: Number,
    reflect: true
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

  static styles = css`
    :host {
      display: block;
    }
    *:focus {
      outline: none;
    }
    app-layout {
      min-height: 400px;
      overflow-y: hidden;
    }
    app-header {
      margin: 0;
      padding: 0;
    }
    paper-input {
      --paper-input-container-color:       rgba(255, 255, 255, 0.64);
      --paper-input-container-focus-color: rgba(255, 255, 255, 1);
      --paper-input-container-input-color: var(--default-background-color);
    }
    paper-menu {
      width: 130px;
      padding: 8px 0;
    }
    paper-material paper-item {
      cursor: pointer;
      padding: 0 10px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .toolbar-header {
      @apply(--layout-horizontal);
      @apply(--layout-center);
      height: 20px;
      padding: 0 10px;
    }
    .toolbar-tabs {
      margin: 0;
      padding: 0;
    }
    .paper-header {
      background-color: var(--default-primary-color);
    }
    paper-tabs {
      width: 100%;
    }
    paper-menu-button paper-icon-button {
      color: var(--text-primary-color);
      margin-left: 4px;
    }
    .loading {
      @apply(--layout-horizontal);
      @apply(--layout-center);
      @apply(--layout-center-justified);
    }
    #dialog {
      @apply(--layout-horizontal);
      @apply(--layout-center);
    }`

  render() {
    return html`
    <ptm-dialog></ptm-dialog>
    <app-header-layout>
      <app-header class="paper-header" fixed>
        <app-toolbar class="toolbar-header layout" sticky>
          <paper-input
            placeholder="Project Tab Manager"
            class="flex"
            value="${this.query}">
          </paper-input>
          <paper-menu-button
            id="menu"
            horizontal-align="right"
            vertical-offset="2">
            <paper-icon-button
              icon="icons:more-vert"
              class="dropdown-trigger"
              tabindex="-1">
            </paper-icon-button>
            <paper-material class="dropdown-content">
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
        <app-toolbar class="toolbar-tabs" sticky>
          <paper-tabs class="flex" .selected="${this.selected}" tabindex="-1">
            <paper-tab tabindex="-1">${l10n('sessions')}</paper-tab>
            <paper-tab tabindex="-1">${l10n('projects')}</paper-tab>
          </paper-tabs>
        </app-toolbar>
      </app-header>
      <iron-meta id="meta" type="dialog"></iron-meta>
      <ptm-project-linker id="linker"
        .projects="${this.projects}"
        @link-project="${this.linkProject}"
        @unlink-project="${this.unlinkProject}"></ptm-project-linker>
      <ptm-options id="options"></ptm-options>
      <iron-pages id="pages" .selected="${this.selected}">
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
        <div class="fit loading">
          <paper-spinner active></paper-spinner>
        </div>
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
      </paper-toast>
    </app-header-layout>`;
  }

  public async firstUpdated() {
    this.toast = this.querySelector('#toast');
    this.pages = this.querySelector('#pages');
    this.menu = this.querySelector('#menu');
    this.options = this.querySelector('#options');
    this.linker = this.querySelector('#linker');
    this.meta = this.querySelector('#meta');
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
    this.fire('reload', {
      forceReload: false
    });
  }

  public async reload(e: CustomEvent) {
    if (this.pages) {
      this.pages.selected = 2;
    }
    this.projects = await this.command('update', { forceReload: e.detail.forceReload || true });
    // this.projectManager =
    //   chrome.extension.getBackgroundPage().projectManager;
    // this.set('projectManager.projects', this.projectManager.projects);
    if (this.pages) {
      this.pages.selected = this.selected;
    }
    this.menu?.close();
  }

  public manageBookmarks() {
    this.command('openBookmarkEditWindow');
    // this.projectManager.openBookmarkEditWindow();
  }

  public openSettings() {
    this.options?.open();
    this.menu?.close();
  }

  public openHelp() {
    this.command('openHelp');
    // chrome.tabs.create({url: chrome.extension.getURL('/README.html')});
  }

  private getProjectFromId(
    projectId: string
  ): ProjectEntity | undefined {
    return this.projects.find(project => project.id === projectId);
  }

  private _queryChanged(
    newValue: string,
    oldValue: string
  ) {
    if (oldValue == newValue) return;
    if (newValue.length === 0 && this.pages) {
      this.pages.selected = this.previousPage;
    } else {
      if (this.pages && this.pages.selected != 3) {
        this.previousPage = <number>this.pages.selected;
        this.pages.selected = 3;
      }
      // TODO:
      // this.debounce('search', this.search.bind(this), 150);
    }
  }

  private openLinker(e: CustomEvent) {
    const project = this.getProjectFromId(e.detail.id);
    if (project) {
      this.linker?.open(project);
    } else {
      this.fire('show-toast', {
        text: l10n('project_to_link_not_found')
      });
    }
  }

  private linkProject(e: CustomEvent) {
    let srcProj: any = this.getProjectFromId(e.detail.srcProjId);
    let dstProj: any = this.getProjectFromId(e.detail.dstProjId);

    if (!srcProj || !dstProj) {
      this.fire('show-toast', {
        text: l10n('failed_linking')
      });
      return;
    }

    if (!!dstProj.session) {
      var bookmark = dstProj.bookmark;
      dstProj.deassociateBookmark();
      // create a dummy target project
      dstProj = {
        bookmark: bookmark
      };
    }
    srcProj.associateBookmark(dstProj.bookmark);

    this.linker?.close();
    this.fire('reload');
    this.fire('show-toast', {
      text: l10n('project_linked')
    });
  }

  private unlinkProject(e: CustomEvent) {
    if (e.detail.targetProject) {
      const targetProject = e.detail.targetProject;
      targetProject.deassociateBookmark();

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
  }

  private async openProject(
    e: CustomEvent
  ): Promise<void> {
    const project = this.getProjectFromId(e.detail.id);
    if (!project) {
      this.fire('show-toast', {
        text: l10n('failed_opening')
      });
      return;
    }
    project.open();
    if (this.shiftKey) {
      const project = await this.command('getActiveProject');
      project?.close();
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
      project.deassociateBookmark();
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
    var project = this.getProjectFromId(e.detail.id);
    if (!project) {
      this.fire('show-toast', {
        // TODO: l10n-nize
        text: 'Failed renaming a project'
      });
      return;
    }
    try {
      const qs: PtmDialogQueryString = {
        line1: l10n('rename_a_project'),
        line2: l10n('change_project_name_notice'),
        answer: project.title,
        placeholder: l10n('new_project_name'),
        confirm: l10n('update'),
        cancel: l10n('cancel')
      };
      const projectName = await this.meta?.byKey('confirm').prompt(qs);
      await this.command('renameProject', {
        projectId: project.id,
        title: projectName
      });
      // TODO: render
      this.fire('reload');
      this.fire('show-toast', {
        text: l10n('project_renamed')
      });
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
      // TODO: render
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

  public async search(): Promise<void> {
    let projects: ProjectEntity[] = await Util.deepCopy(this.projects);
    const queryLC = this.query.toLowerCase();
    projects = projects.filter(project => {
      project.fields = project.fields.filter(field => {
        const title = field.title?.toLowerCase();
        return title?.indexOf(queryLC) === -1 ? false : true;
      });
      const title = project.title.toLocaleLowerCase();
      return title?.indexOf(queryLC) === -1 ? false : true;
    });
    // for (var i = 0; i < projects.length; i++) {
    //   var project = projects[i];
    //   for (var j = 0; j < project.fields.length; j++) {
    //     var fieldTitle = project.fields[j].title?.toLowerCase();
    //     if (fieldTitle?.indexOf(queryLC) === -1) {
    //       project.fields.splice(j, 1);
    //       j--;
    //     }
    //   }
    //   if (project.fields.length === 0) {
    //     const projectTitle = project.title.toLowerCase();
    //     if (projectTitle.indexOf(queryLC) === -1) {
    //       projects.splice(i, 1);
    //       i--;
    //     }
    //   }
    // }
    this.searchResults = projects;
  }
};