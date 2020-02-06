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

import { html, customElement, property } from "lit-element";
import { PtmBase } from './ptm-base';
import { l10n } from '../ts/ChromeL10N';
import { ProjectEntity } from "../ts/ProjectEntity";
import { PaperDialogElement } from '@polymer/paper-dialog';
import { IronMetaElement } from '@polymer/iron-meta';
import '@polymer/iron-meta/iron-meta.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-button/paper-button.js';


@customElement('ptm-project-linker')
export class PtmProjectLinker extends PtmBase {
  @property({
    type: []
  })
  projects: ProjectEntity[] = []

  @property({
    type: String
  })
  linkingProjectId?: string

  @property({
    type: Boolean
  })
  bookmarked: boolean = false

  @property({
    type: Object
  })
  meta: IronMetaElement | undefined

  @property({
    type: Object
  })
  repeat: Element | undefined

  @property({
    type: Object
  })
  dialog: PaperDialogElement | undefined

  render() {
    return html`
      <style>
        h2 {
          width: 180px;
        }
        iron-icon {
          width: 16px;
          height: 16px;
          margin-right: 4px;
          flex: 1 1 16px;
        }
        paper-dialog-scrollable {
          margin-top: 10px;
          padding: 0 16px;
        }
        paper-dialog {
          font-size: 1.0em;
          margin: 0 20px;
          max-width: none;
        }
        paper-item {
          cursor: pointer;
          font-size: 1.0em;
          padding: 0 16px;
          margin: 0;
          background-color: var(--default-background-color);
          min-height: 24px;
          line-height: 16px;
          display: flex;
        }
        paper-item:not([disabled]):hover {
          background-color: var(--primary-background-color);
        }
        paper-item[disabled] {
          cursor: auto;
          color: var(--disabled-text-color);
        }
        .title {
          cursor: pointer;
          color: var(--secondary-text-color);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          flex: 1 1 auto;
        }
        .buttons {
          padding: 10px 5px 10px 10px;
        }
        paper-button {
          color: var(--text-primary-color);
          background-color: var(--default-primary-color);
        }
        .accent {
          color: var(--text-primary-color);
          background-color: var(--accent-color);
        }
      </style>
      <iron-meta id="meta" type="dialog"></iron-meta>
      <paper-dialog id="dialog" modal>
        <h2>${l10n('link_session_to_a_project')}</h2>
        <paper-dialog-scrollable>
          ${this.projects.map(project => {
          return !!project.bookmark ? html`
          <paper-item
            @click="${this.onLink}"
            ?data-session="${!!project.session}"
            data-project-id="${project.id}">
            <span class="title">${project.title}</span>
            <iron-icon icon="${!project.session ? '' : 'link'}"></iron-icon>
          </paper-item>
          ` : ''})}
        </paper-dialog-scrollable>
        <div class="buttons">
          <paper-button
            @click="${this.close}"
            raised>
            ${l10n('cancel')}
          </paper-button>
          ${this.linkingProjectId ? html`
          <paper-button
            class="accent"
            @click="${this.onUnlink}"
            raised>
            ${l10n('unlink')}
          </paper-button>
          `: ''})}
        </div>
      </paper-dialog>
    `;
  }

  public firstUpdated() {
    this.meta = this.querySelector('#meta');
    this.repeat = this.querySelector('#repeat');
    this.dialog = this.querySelector('#dialog');
  }

  public open(
    linkingProjectId: string,
    bookmarked: boolean
  ) {
    this.linkingProjectId = linkingProjectId;
    this.bookmarked = bookmarked;
    this.dialog?.open();
  }

  public close() {
    this.dialog?.close();
  }

  private async onLink(e: MouseEvent): Promise<void> {
    this.close();
    // already linked?
    const elem = e.currentTarget as HTMLElement;
    if (elem.dataset.session) {
      await this.meta?.byKey('confirm').confirm({
        line1: l10n('linked_project'),
        line2: l10n('confirm_breaking_link'),
        confirm: l10n('ok'),
        cancel: l10n('cancel')
      });
      this.fire('link-project', {
        srcProjId: this.linkingProjectId,
        dstProjId: elem.dataset.projectId
      });
    } else {
      this.fire('link-project', {
        srcProjId: this.linkingProjectId,
        dstProjId: elem.dataset.projectId
      });
    }
  }

  private onUnlink(e: MouseEvent): void {
    // e.stoppropagation();
    this.close();
    this.fire('unlink-project', {
      targetProjId: this.linkingProjectId,
    });
  }
}
