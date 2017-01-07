/*
Copyright 2015 Eiji Kitamura

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

import config_ from './Config';
import util from './Utilities';
import sessionManager from './SessionManager';
import bookmarkManager from './BookmarkManager';

/**
 * [normalizeBookmarks description]
 * @param  {Array} src [description]
 * @param  {Array} dst [description]
 * @return {[type]}     [description]
 */
const normalizeBookmarks = function(
    src: Array<chrome.bookmarks.BookmarkTreeNode> = [],
    dst: Array<chrome.bookmarks.BookmarkTreeNode> = []
  ): Array<chrome.bookmarks.BookmarkTreeNode> {
  for (let s of src) {
    if (s.url) {
      dst.push(s);
    } else if (s.children.length > 0) {
      // by recursively calling this function, append bookmarks to dst
      normalizeBookmarks(s.children, dst);
    }
  }
  return dst;
};

/**
 * [FieldEntity description]
 * @param {TabEntity}                         tab      [description]
 * @param {chrome.bookmarks.BookmarkTreeNode} bookmark [description]
 */
class FieldEntity {
  id: string = undefined
  tabId: number = undefined
  title: string = ''
  url: string = ''
  pinned: boolean = false
  favIconUrl: string = ''

  constructor(tab: chrome.tabs.Tab, bookmark: chrome.bookmarks.BookmarkTreeNode) {
    let url         = util.unlazify(tab && tab.url || bookmark.url);

    this.id         = bookmark && bookmark.id || undefined;
    this.tabId      = tab && tab.id || undefined;
    // this.index      = tab && tab.index || undefined; // TODO: what if index==0
    this.title      = tab && tab.title || bookmark && bookmark.title || '';
    this.url        = url;
    this.pinned     = tab && tab.pinned || false;
    this.favIconUrl = tab && tab.favIconUrl || '';
  }
}

/**
 * [ProjectEntity description]
 * @param {SessionEntity}                     session [description]
 * @param {chrome.bookmarks.BookmarkTreeNode} folder  [description]
 */
class ProjectEntity {
  id: string = '0'
  fields: Array<FieldEntity> = []
  session: SessionEntity = null
  bookmark: chrome.bookmarks.BookmarkTreeNode = null
  title: string = chrome.i18n.getMessage('new_project')

  constructor(session: SessionEntity, bookmark: chrome.bookmarks.BookmarkTreeNode) {
    this.id           = (bookmark && bookmark.id) || (session && session.id) || '0';
    this.session      = session;
    this.bookmark     = bookmark;
    this.title        = (bookmark && bookmark.title) || (session && session.title) || chrome.i18n.getMessage('new_project');

    // Set project id on session only when both session and bookmaks are available
    if (this.session && this.bookmark) {
      this.session.setId(this.bookmark.id);
    }

    this.load(session && session.tabs || [], bookmark && bookmark.children || []);
  }

  /**
   * [open description]
   * @return {[type]}            [description]
   */
  public open() {
    sessionManager.openingProject = this.id;
    this.setBadgeText();

    // If there's no fields, open an empty window
    if (this.fields.length === 0) {
      chrome.windows.create({ focused: true });

    // If there's a session
    } else if (this.session) {

      if (this.session.winId) {
        // And it is already open
        chrome.windows.update(this.session.winId, {focused:true});
      } else {
        // If the session is not open yet
        this.session.openTabs();
      }

    // If there's no session, open from bookmark
    } else if (this.bookmark) {
      if (config_.debug) console.log('[ProjectEntity] Opening bookmarks', this.bookmark);

      let bookmarks = normalizeBookmarks(this.bookmark.children, []);

      // open first tab with window
      chrome.windows.create({
        url: bookmarks[0].url,
        focused: true
      }, win => {
        let skipFirst = false;
        // open bookmarks in window
        bookmarks.forEach((bookmark, i) => {
          // skip if undefined or first bookmark (since it's already open)
          if (i === 0) return;

          let url = config_.lazyLoad ? bookmark.url : util.lazify(bookmark.url, bookmark.title);
          chrome.tabs.create({
            windowId: win.id,
            url:      url,
            active:   false
          });
        });
      });
    }
  }

  /**
   * Closes the project window
   * @return Promise returns promise object
   */
  public close() {
    if (this.session.winId) {
      // TODO: This is not returning Promise. no need to call `return`
      return chrome.windows.remove(this.session.winId);
    }
  }

  /**
   * Rename project
   */
  public rename(name: string = ''): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(async (resolve, reject) => {
      if (name.length === 0) reject();
      this.title = name;
      if (!this.bookmark) {
        let folder = await bookmarkManager.addFolder(name);
        this.id       = folder.id;
        this.bookmark = folder;
        if (this.session) {
          this.session.setId(folder.id);
        }
        this.setBadgeText();
        resolve(folder);
      } else {
        let folder = await bookmarkManager.renameFolder(this.id, name);
        this.setBadgeText();
        resolve(folder);
      }
    });
  }

  /**
   * [load description]
   * @param  {Array}            tabs      Array of chrome.tabs.Tab
   * @param  {Array}            bookmarks Array of chrome.bookmarks.BookmarkTreeNode
   */
  public load(
    tabs: Array<chrome.tabs.Tab> = [],
    bookmarks: Array<chrome.bookmarks.BookmarkTreeNode> = []
  ) {
    this.fields = [];
    let copy = normalizeBookmarks(bookmarks, []), j;

    // Loop through tabs
    for (let tab of tabs) {
      if (tab.url.match(util.CHROME_EXCEPTION_URL)) continue;

      let bookmark = null;
      // Loop through bookmarks to find matched one
      let index = copy.findIndex(c => {
        return util.resembleUrls(tab.url, c.url);
      });
      if (index > -1) {
        bookmark = copy.splice(index, 1)[0];
      }
      this.fields.push(new FieldEntity(tab, bookmark));
    }

    for (let c of copy) {
      this.fields.push(new FieldEntity(undefined, c));
    }
  }

  /**
   * Adds bookmark of given tab id
   * @param {Integer}         tabId
   */
  public async addBookmark(tabId: number): Promise<chrome.bookmarks.BookmarkTreeNode> {
    let title, url;
    let field = this.fields.find(field => {
      return field.tabId === tabId;
    });
    if (field) {
      title = field.title;
      url   = field.url;
    } else {
      throw 'Unsync session. Adding bookmark failed because relevant tab counld\'t be found';
    }

    if (!this.bookmark) {
      let folder = await bookmarkManager.addFolder(this.title);
      this.id       = folder.id;
      this.bookmark = folder;
      if (this.session) {
        this.session.setId(folder.id);
      }
    }
    let bookmark = await bookmarkManager.addBookmark(this.id, title, url);
    this.bookmark = bookmarkManager.getFolder(bookmark.parentId);
    this.load(this.session.tabs, this.bookmark.children);
    return Promise.resolve(bookmark);
  }

  /**
   * Opens this bookmark folder's edit window
   */
  public openBookmarkEditWindow() {
    bookmarkManager.openEditWindow(this.id);
  }

  /**
   * Removes bookmark of given bookmark id
   * @param {Integer}         bookmarkId
   */
  public removeBookmark(bookmarkId: number) {
    return bookmarkManager.removeBookmark(bookmarkId);
  }

  /**
   * Associates a project with bookmark entity. Use when:
   * - creating new project from session
   * @param  {[type]} folder [description]
   * @return {[type]}        [description]
   */
  public associateBookmark(folder: chrome.bookmarks.BookmarkTreeNode) {
    this.id = folder.id; // Overwrite project id
    if (config_.debug) console.log('[ProjectEntity] associated bookmark', folder);
    this.bookmark = folder;
    this.session.setId(this.id); // Overwrite project id
    this.load(this.session.tabs, this.bookmark.children);
  }

  /**
   * Remove association of a project with bookmark entity. Use when:
   * - unlinking bookmark with a session
   * - abondoning a session from linked project
   */
  public deassociateBookmark() {
    this.id = `-${this.session.id}`;
    if (config_.debug) console.log('[ProjectEntity] deassociated bookmark', this.bookmark);
    this.bookmark = null;
    this.title = this.session.title;
    this.session.setId(this.id);
    this.load(this.session.tabs, undefined);
  }

  /**
   * Sets badge text
   * @param {String} winId Window Id
   */
  public setBadgeText() {
    let text = this.title.substr(0, 4).trim() || '';
    if (config_.debug) console.log(`[ProjectEntiry] Badge set to "${text}"`, this);
    chrome.browserAction.setBadgeText({text: text});
  }
}

/**
 * [ProjectManager description]
 */
class ProjectManager {
  projects: Array<ProjectEntity> = []

  constructor() {
    chrome.windows.onFocusChanged.addListener(winId => {
      let project = this.getProjectFromWinId(winId);
      if (project) {
        project.setBadgeText();
      } else {
        chrome.browserAction.setBadgeText({text: ''});
      }
    });
  }

  /**
   * [saveNewProject description]
   * @param  {[type]} id    project id
   * @param  {[type]} title optional title
   * @return {[type]}       [description]
   */
  public createProject(id: string, title: string) {
    return new Promise(async resolve => {
      let project = this.getProjectFromId(id);

      if (!project || !project.session) {
        throw '[ProjectManager] Session not found when creating new project';
      }
      let session = project.session;
      title = title || session.title;

      let folder = await bookmarkManager.addFolder(title);
      for (let tab of session.tabs) {
        bookmarkManager.addBookmark(folder.id, tab.title, tab.url);
      }
      // Create new project
      let newProject = new ProjectEntity(session, folder);
      // Remove non-bound session project
      this.removeProject(id);
      // Add the new project to list
      this.projects.unshift(newProject);

      if (config_.debug) console.log('[ProjectManager] created new project', newProject);
      resolve(newProject);
    });
  }

  /**
   * Gets Project of given project id
   * @param  {String} id
   * @return {ProjectEntity|undefined}
   */
  public getProjectFromId(id: string): ProjectEntity {
    return this.projects.find(project => {
      return project.id === id;
    });
  }

  /**
   * Gets project of given window id
   * @param  {Integer} winId
   * @return {ProjectEntity|undefined}
   */
  public getProjectFromWinId(winId: number): ProjectEntity {
    return this.projects.find(project => {
      return project.session && project.session.winId === winId;
    });
  }

  /**
   * Renames project of given project id
   * @param  {String} project id
   * @return void
   */
  public renameProject(id: string, title: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    let project = this.getProjectFromId(id);
    if (project) {
      return project.rename(title);
    } else {
      return Promise.reject(`Project ${id} not found`);
    }
  }

  /**
   * Removes a project from bookmark
   * @param  {String}           id        [description]
   * @param  {requestCallback}  callback  [description]
   */
  public async removeProject(id: string): Promise<ProjectEntity|SessionEntity> {
    let index = this.projects.findIndex(project => {
      return project.id === id;
    });
    if (index > -1) {
      // Remove project from list first
      let project = this.projects.splice(index, 1)[0];
      // Then remove bookmark if exists (otherwise non-bound session)
      if (project.bookmark) {
        try {
          await bookmarkManager.archiveFolder(id);
          // Session might be non bound. Don't return promise directly.
          sessionManager.removeSessionFromProjectId(id);
          if (config_.debug) console.log('[ProjectManager] removed project %s from bookmark', id);
          return Promise.resolve(project);
        } catch() {
          if (config_.debug) console.log('[ProjectManager] failed to remove project %s from bookmark', id);
          return Promise.resolve(project);
        };
      } else {
        // non-bound session should be removed from session list as well
        return sessionManager.removeSessionFromProjectId(id);
      }
    } else {
      return Promise.reject();
    }
  }

  /**
   * Removes session part of the project
   * @param  {String}           id       [description]
   * @param  {requestCallback}  callback [description]
   */
  public removeSession(id: string): Promise<SessionEntity> {
    let project = this.getProjectFromId(id);
    if (project.bookmark) {
      project.deassociateBookmark();
    }
    return sessionManager.removeSessionFromId(project.session.id);
  }

  /**
   * [getActiveProject description]
   * @return {[type]} [description]
   */
  public getActiveProject(): ProjectEntity {
    let winId = sessionManager.getCurrentWindowId();
    if (winId) {
      let project = this.getProjectFromWinId(winId);
      if (config_.debug) console.log('[SessionManager] Got active project', project);
      return project;
    } else {
      return undefined;
    }
  }

  /**
   * [getCurrentWindowId description]
   * @return {[type]} [description]
   */
  public getActiveWindowId(callback: Function) {
    callback(sessionManager.getCurrentWindowId());
  }

  /**
   * [update description]
   * @return {[type]} [description]
   */
  public async update(force_reload: boolean, callback?: Function) {
    if (config_.debug) console.log('[ProjectManager] Starting to generate project list');
    this.projects = [];
    let session, project, i, j,
      sessions = sessionManager.getSessions().slice(0);

    let bookmarks = await bookmarkManager.getRoot(force_reload);
    let boundId = [];

    // Append non-bound sessions first
    for (let session of sessions) {
      if (session.id && session.id.indexOf('-') === -1) {
        // This is bound session
        let found = false;
        // Look for bound bookmark
        let bookmark = bookmarks.find(bookmark => {
          return bookmark.id == session.id;
        });
        if (bookmark) {
          project = new ProjectEntity(session, bookmark);
          this.projects.push(project);
          boundId.push(bookmark.id);
          if (config_.debug) console.log('[ProjectManager] Project %s: %o created from session: %o and bookmark: %o', project.id, project, session, bookmark);
          continue;
        }
      }

      // If session is not bound or matching bookmark was not found
      project = new ProjectEntity(session, null);
      this.projects.push(project);
      if (config_.debug) console.log('[ProjectManager] Project %s: %o created non-bound session: %o', project.id, project, session);
    }

    // Add rest of bookmarks
    for (let bookmark of bookmarks) {
      if (boundId.includes(bookmark.id)) continue;
      if (bookmark.title === config_.archiveFolderName) continue;
      project = new ProjectEntity(null, bookmark);
      this.projects.push(project);
      if (config_.debug) console.log('[ProjectManager] Project %s: %o created non-bound bookmark: %o', project.id, project, bookmark);
    }

    if (typeof callback === 'function') callback(this);
  }

  /**
   * [openBookmarkEditWindow description]
   * @param  {String} bookmarkId
   */
  public openBookmarkEditWindow(bookmarkId) {
    bookmarkManager.openEditWindow(bookmarkId);
  }

  /**
   * Sets badge text
   * @param {Integer} winId Window Id
   */
  public setBadgeText(winId: number) {
    let project = this.getProjectFromWinId(winId);
    let text = project && project.title.substr(0, 4).trim() || '';
    if (config_.debug) console.log(`[ProjectManager] Badge set to "${project.title}"`, project);
    chrome.browserAction.setBadgeText({text: text});
  }

  /**
   * [getTimeTable description]
   * @param  {[type]}   date     [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  public getTimeTable(date: string, callback: Function) {
    sessionManager.getTimeTable(date, table => {
      table.forEach(session => {
        if (session.id) {
          let project = this.getProjectFromId(session.id);
          let _session = sessionManager.getSessionFromProjectId(session.id);
          session.title = project && project.title || _session && _session.title;
        } else {
          session.title = 'Unknown';
        }
      });
      callback(table);
    });
  }

  /**
   * [getSummary description]
   * @param  {[type]}   start    [description]
   * @param  {[type]}   end      [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  public getSummary(start: number, end: number, callback: Function) {
    sessionManager.getSummary(start, end, summary => {
      for (let id in summary) {
        let title = 'Unknown';
        let project = this.getProjectFromId(id);
        if (project) {
          title = project.title;
        }
        summary[id].title = title;
      }
      callback(summary);
    });
  }
}

const projectManager = new ProjectManager();

export default projectManager;