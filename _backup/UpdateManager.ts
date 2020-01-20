import { Util } from '../ts/Util';
import { SessionEntity } from '../ts/SessionEntity';

/**
 * Synchronize session status on chrome.storage
 */
export class UpdateManager {
  static queue: chrome.tabs.Tab[] = []

  /**
   * [initialize description]
   */
  static restoreSessions(): Promise<SessionEntity[]> {
    return new Promise((resolve, reject) => {
      // restore projects from chrome.storage.local
      chrome.storage.local.get(items => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject();
        } else {
          // 'projects' is a transitional solution
          const sessions = items['sessions'] || items['projects'] || [];
          Util.log('[UpdateManager] restoring sessions from storage.', sessions);
          resolve(sessions);
        }
      });
    });
  }

  /**
   * Synchronize project status to chrome.storage.
   * Restores when on initialization.
   */
  static storeSessions(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(sessionManager.export(), () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject();
        } else {
          Util.log('[UpdateManager] sessions stored.', sessionManager.sessions);
          resolve();
        }
      });
    });
  }

  /**
   * Add sync status to queue so that synchronization only happens when all status is clear.
   * @param {chrome.tabs.Tab} tab
   */
  static tabLoading(
    tab: chrome.tabs.Tab
  ): void {
    const i = UpdateManager.queue.findIndex(session => session.id === tab.id);
    if (i > -1) {
      UpdateManager.queue[i] = tab;
      Util.log('[UpdateManager] tab %o loading. %d in total', tab, UpdateManager.queue.length);
      return;
    }
    UpdateManager.queue.push(tab);
    Util.log('[UpdateManager] added tab %o. %d in total.', tab, UpdateManager.queue.length);
  }

  /**
   * Removes completed sync status and kick start synchronization when all queue's gone.
   * @param {chrome.tabs.Tab} tab
   */
  static tabComplete(
    tab: chrome.tabs.Tab
  ): void {
    const i = UpdateManager.queue.findIndex(session => session.id === tab.id);
    if (i > -1) {
      UpdateManager.queue.splice(i, 1);
    }
    if (UpdateManager.queue.length === 0) {
      Util.log('[UpdateManager] Queue cleared. Storing session.');
      UpdateManager.storeSessions();
    } else {
      Util.log('[UpdateManager] tab %o sync completed. %o remaining', tab, UpdateManager.queue);
    }
  }
};
