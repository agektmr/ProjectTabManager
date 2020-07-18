/*
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
*/

/// <reference path="../../node_modules/@types/chrome/index.d.ts" />

import { SyncConfig, Config } from './Config';
import { Util } from './Util';
import { SessionManager } from './SessionManager';
import { BookmarkManager } from './BookmarkManager';
import { ProjectEntity } from './ProjectEntity';
import { SessionEntity } from './SessionEntity';
import { FieldEntity } from './FieldEntity';

/**
 * [ProjectManager description]
 * @param {[type]} config [description]
 */
export class ProjectManager {
  public projects: ProjectEntity[] = []
  private config: Config
  private sessionManager: SessionManager

  constructor(
    config: Config,
    sessionManager: SessionManager
  ) {
    this.config = config;
    this.sessionManager = sessionManager;

    chrome.windows.onFocusChanged.addListener(winId => {
      const project = this.getProjectFromWinId(winId);
      if (project) {
        project.setBadgeText();
      } else {
        chrome.browserAction.setBadgeText({text: ''});
      }
    });
  }

  public async openProject(
    projectId: string,
    closeCurrent: boolean = false
  ): Promise<boolean> {
    const project = this.getProjectFromId(projectId);
    if (!project) return false;
    this.sessionManager.openingProject = projectId;
    const active = this.getActiveProject();
    if (active && closeCurrent) active.close();
    return project.open(this.config.lazyLoad);
  }

  /**
   * [saveNewProject description]
   * @param  {[type]} projectId    project id
   * @param  {[type]} title optional title
   * @return {[type]}       [description]
   */
  public async createProject(
    projectId: string,
    title: string
  ): Promise<ProjectEntity> {
    const project = this.getProjectFromId(projectId);

    if (!project || !project.session) {
      throw '[ProjectManager] Session not found when creating new project';
    }
    project.deassociateBookmark();
    const session = project.session;
    title = title || session.title;

    const folder = await BookmarkManager.addFolder(title)
    for (let tab of session.tabs) {
      const { title, url } = tab;
      BookmarkManager.addBookmark(folder.id, title, url);
    }
    // Create new project
    const new_project = new ProjectEntity(session, folder);
    // Remove non-bound session project
    this.removeProject(projectId);
    // Add the new project to list
    this.projects.unshift(new_project);

    Util.log('[ProjectManager] created new project', new_project);
    return new_project;
  }

  /**
   * Removes a project from bookmark
   * @param  {String}           projectId        [description]
   * @param  {requestCallback}  callback  [description]
   */
  public async removeProject(
    projectId: string
  ): Promise<ProjectEntity | undefined> {
    let i = this.projects.findIndex(project => project.id === projectId);
    if (i === -1) return;

    // Remove project from list first
    const project = this.projects.splice(i, 1)[0];
    // Then remove bookmark if exists (otherwise non-bound session)
    if (project.bookmark) {
      try {
        await BookmarkManager.archiveFolder(projectId)
      } catch (e) {
        Util.log('[ProjectManager] failed to remove project %s from bookmark', projectId);
      }
    }
    Util.log('[ProjectManager] removed project %s from bookmark', projectId);
    return project;
  }

  /**
   * Gets Project of given project id
   * @param  {String} id
   * @return {ProjectEntity|undefined}
   */
  public getProjectFromId(
    id: string
  ): ProjectEntity | undefined {
    return this.projects.find(project => project.id === id);
  }

  /**
   * Gets project of given window id
   * @param  {Integer} winId
   * @return {ProjectEntity|undefined}
   */
  public getProjectFromWinId(
    winId: number
  ): ProjectEntity | undefined {
    return this.projects.find(project => project.session?.winId === winId);
  }

  public async search(
    query: string
  ): Promise<ProjectEntity[]> {
    const projects = Util.deepCopy(this.projects);
    const queryLC = query.toLowerCase();
    return projects.filter(project => {
      // project.fields = project.fields.filter(field => {
      //   const title = field.title?.toLowerCase();
      //   return title?.indexOf(queryLC) === -1 ? false : true;
      // });
      const title = project.title.toLocaleLowerCase();
      return title?.indexOf(queryLC) === -1 ? false : true;
    });
  }

  public async linkProject(
    srcProjId: string,
    dstProjId: string
  ): Promise<boolean> {
    let srcProj: ProjectEntity | undefined = this.getProjectFromId(srcProjId);
    let dstProj: ProjectEntity | undefined = this.getProjectFromId(dstProjId);

    if (!srcProj || !dstProj) {
      return false;
    }

    if (dstProj.session) {
      const bookmark = dstProj.bookmark;
      dstProj.deassociateBookmark();
      // create a dummy target project
      dstProj = new ProjectEntity(undefined, bookmark);
    }
    // @ts-ignore
    srcProj.associateBookmark(dstProj.bookmark);
    return true;
  }

  public async unlinkProject(
    targetProjId: string
  ): Promise<boolean> {
    if (!targetProjId) return false;
    const targetProject = this.getProjectFromId(targetProjId);
    if (targetProject) {
      targetProject.deassociateBookmark();
      return true
    } else {
      return false;
    }
  }

  /**
   * Renames project of given project id
   * @param  {String} project id
   * @return void
   */
  public async renameProject(
    projectId: string,
    title: string
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    let folder: chrome.bookmarks.BookmarkTreeNode;

    const project = this.getProjectFromId(projectId);
    if (!project) throw `Project ${projectId} not found`;
    project.title = title;

    if (!project.bookmark) {
      folder = await BookmarkManager.addFolder(title);
      project.id       = folder.id;
      project.bookmark = folder;
      if (project.session) project.session.setId(folder.id);
    } else {
      folder = await BookmarkManager.renameFolder(project.id, title);
    }
    project.setBadgeText();
    return folder;
  }

  /**
   * [getActiveProject description]
   * @return {[type]} [description]
   */
  public getActiveProject(): ProjectEntity | undefined {
    const winId = this.sessionManager.getCurrentWindowId();
    if (winId) {
      const project = this.getProjectFromWinId(winId);
      Util.log('[SessionManager] Got active project', project);
      return project;
    } else {
      return undefined;
    }
  }

  /**
   * Removes session part of the project
   * TODO: Not used? Shall I delete this?
   * @param  {String}           projectId       [description]
   */
  public async removeSession(
    projectId: string
  ): Promise<void> {
    const project = this.getProjectFromId(projectId);
    if (!project) return;
    if (project.bookmark) project.deassociateBookmark();
    const sessionId = project.session?.id;
    if (!sessionId) return;
    this.sessionManager.removeSessionFromProjectId(sessionId);
    return;
  }

  /**
   * [getCurrentWindowId description]
   * @return {[type]} [description]
   */
  public async getActiveWindowId(): Promise<number | undefined> {
    return this.sessionManager.getCurrentWindowId();
  }

  /**
   * [update description]
   * @return {[type]} [description]
   */
  public async update(): Promise<ProjectEntity[]> {
    Util.log('[ProjectManager] Starting to generate project list');
    this.projects = [];
    let project, sessions = this.sessionManager.getSessions().slice(0);

    const bookmarks = await BookmarkManager.getBookmarkFolders()
    let boundId = [];

    // Append non-bound sessions first
    for (let session of sessions) {
      if (session?.id?.indexOf('-') === -1) {
        // This is bound session
        let found = false;
        // Look for bound bookmark
        for (let bookmark of bookmarks) {
          if (bookmark.id === session.id) {
            project = new ProjectEntity(session, bookmark);
            this.projects.push(project);
            boundId.push(bookmark.id);
            Util.log('[ProjectManager] Project %s: %o created from session: %o and bookmark: %o', project.id, project, session, bookmark);
            found = true;
            break;
          }
        }
        if (found) continue;
      }

      // If session is not bound or matching bookmark was not found
      project = new ProjectEntity(session, undefined);
      this.projects.push(project);
      Util.log('[ProjectManager] Project %s: %o created non-bound session: %o', project.id, project, session);
    }

    // Add rest of bookmarks
    for (let bookmark of bookmarks) {
      if (boundId.includes(bookmark.id)) continue;
      if (bookmark.title === this.config.archiveFolderName) continue;
      project = new ProjectEntity(undefined, bookmark);
      this.projects.push(project);
      Util.log('[ProjectManager] Project %s: %o created non-bound bookmark: %o', project.id, project, bookmark);
    }

    return this.projects;
  }

  public async getConfig(): Promise<SyncConfig> {
    return this.config.get();
  }

  public async setConfig(
    config: SyncConfig
  ): Promise<void> {
    return this.config.sync(config);
  }

  /**
   * Opens a bookmarked tab or focus on the tab with the same URL
   * @param tabId
   * @param url
   */
  public async openBookmark(
    tabId: number | undefined,
    url: string
  ): Promise<void> {
    Util.log('[ProjectManager] Opening a bookmark', tabId, url);
    await BookmarkManager.openBookmark(tabId, url);
  }

  public async addBookmark(
    projectId: string,
    tabId: number
  ): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
    const project = this.getProjectFromId(projectId);
    if (!project)
      throw '[ProjectManager] Project to add bookmark not found';
    return project.addBookmark(tabId);
  }

  public async removeBookmark(
    projectId: string,
    bookmarkId: string
  ): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
    const project = this.getProjectFromId(projectId);
    if (!project)
      throw '[ProjectManager] Project to remove bookmark not found';
    return project.removeBookmark(bookmarkId);
  }

  // /**
  //  * Removes or adds a bookmark depending on current status
  //  * @param projectId
  //  * @param tabId
  //  */
  // public async toggleBookmark(
  //   projectId: string,
  //   tabId?: number,
  //   bookmarkId?: string
  // ): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
  //   const project = this.getProjectFromId(projectId);
  //   if (!project)
  //     throw '[ProjectManager] Project to toggle bookmark not found';

  //   if (tabId) {
  //     return project.addBookmark(tabId);
  //   } else if (bookmarkId) {
  //     return project.removeBookmark(bookmarkId);
  //   } else {
  //     throw '[ProjectEntity] Unexpected attempt to toggle bookmark';
  //   }
  // }

  /**
   * Open the bookmark manager page.
   * @param  {String} bookmarkId
   */
  public async openBookmarkEditWindow(
    bookmarkId?: string
  ): Promise<void> {
    if (!bookmarkId) {
      const root = await BookmarkManager.getRootFolder();
      bookmarkId = root.id;
    }
    BookmarkManager.openEditWindow(bookmarkId);
  }

  /**
   * Open the help page.
   */
  public openHelp(): void {
    chrome.tabs.create({url: chrome.extension.getURL('/README.html')});
  }

  // /**
  //  * Sets badge text
  //  * // TODO: Duplicate function of ProjectEntity
  //  * @param {String} winId Window Id
  //  */
  // public setBadgeText(
  //   winId: number
  // ): void {
  //   const project = this.getProjectFromWinId(winId);
  //   const text = project?.title?.substr(0, 4)?.trim() || '';
  //   Util.log(`[ProjectManager] Badge set to "${project.title}"`, project);
  //   chrome.browserAction.setBadgeText({text: text});
  // }

  // /**
  //  * [getTimeTable description]
  //  * @param  {[type]}   date     [description]
  //  * @param  {Function} callback [description]
  //  * @return {[type]}            [description]
  //  */
  // public getTimeTable(
  //   date: number,
  //   callback: Function
  // ): void {
  //   this.sessionManager.getTimeTable(date, table => {
  //     table.forEach(session => {
  //       if (session.id) {
  //         let project = this.getProjectFromId(session.id);
  //         let _session = this.sessionManager.getSessionFromProjectId(session.id);
  //         session.title = project?.title || _session?.title;
  //       } else {
  //         session.title = 'Unknown';
  //       }
  //     });
  //     callback(table);
  //   });
  // }

  // /**
  //  * [getSummary description]
  //  * @param  {[type]}   start    [description]
  //  * @param  {[type]}   end      [description]
  //  * @param  {Function} callback [description]
  //  * @return {[type]}            [description]
  //  */
  // public getSummary(
  //   start: number,
  //   end: number,
  //   callback: Function
  // ): void {
  //   this.sessionManager.getSummary(start, end, summary => {
  //     for (let id in summary) {
  //       const project = this.getProjectFromId(id);
  //       const title = project?.title || 'Unknown';
  //       summary[id].title = title;
  //     }
  //     callback(summary);
  //   });
  // }
}
