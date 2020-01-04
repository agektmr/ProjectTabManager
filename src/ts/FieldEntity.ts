import { TabEntity } from './TabEntity';
import { Util } from './Util';

/**
 * [FieldEntity description]
 * @param {TabEntity}                         tab      [description]
 * @param {chrome.bookmarks.BookmarkTreeNode} bookmark [description]
 */
export class FieldEntity {
  public projectId: string
  public bookmarkId?: string
  public tabId?: number
  public title?: string
  public url?: string
  public pinned: boolean = false
  public favIconUrl?: string

  constructor(
    projectId: string,
    tab?: TabEntity,
    bookmark?: chrome.bookmarks.BookmarkTreeNode
  ) {
    this.projectId  = projectId;
    this.bookmarkId = bookmark?.id;
    this.tabId      = tab?.id;
    this.title      = tab?.title || bookmark?.title || '';
    this.url        = Util.unlazify(tab?.url || bookmark?.url);
    this.pinned     = tab?.pinned || false;
    this.favIconUrl = tab?.favIconUrl || '';
  }
}
