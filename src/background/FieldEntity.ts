/**
 * /*
 * Copyright 2020 Eiji Kitamura
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Eiji Kitamura (agektmr@gmail.com)
 *
 * @format
 */

import { TabEntity } from './TabEntity';
import { Util } from './Util';

/**
 * [FieldEntity description]
 * @param {TabEntity}                         tab      [description]
 * @param {chrome.bookmarks.BookmarkTreeNode} bookmark [description]
 */
export class FieldEntity {
  public projectId: string;
  public bookmarkId?: string;
  public tabId?: number;
  public title?: string;
  public url?: string;
  public pinned: boolean = false;
  public favIconUrl?: string;

  constructor(
    projectId: string,
    tab?: TabEntity,
    bookmark?: chrome.bookmarks.BookmarkTreeNode,
  ) {
    this.projectId = projectId;
    this.bookmarkId = bookmark?.id;
    this.tabId = tab?.id;
    this.title = tab?.title || bookmark?.title || '';
    this.url = Util.unlazify(tab?.url || bookmark?.url);
    this.pinned = tab?.pinned || false;
    this.favIconUrl = tab?.favIconUrl || '';
  }
}
