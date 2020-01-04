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

import { html, css, customElement, property } from "lit-element";
import { PtmBase } from './ptm-base';
import { l10n } from '../ts/ChromeL10N';
import { ProjectEntity } from "../ts/ProjectEntity";
import { PaperDialogElement } from '@polymer/paper-dialog/paper-dialog';
import { IronMetaElement } from '@polymer/iron-meta/iron-meta';


@customElement('ptm-project-linker')
export class PtmProjectLinker extends PtmBase {
  @property({
    type: []
  })
  projects: ProjectEntity[] = []

  @property({
    type: Object
  })
  linkingProject?: ProjectEntity

  private meta: IronMetaElement | undefined
  private repeat: Element | undefined
  private dialog: PaperDialogElement | undefined

  static styles = css`
    h2 {
      width: 180px;
    }
    iron-icon {
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
    paper-dialog-scrollable {
      --paper-dialog-scrollable: {
        padding: 0;
      }
    }
    paper-item {
      cursor: pointer;
      padding: 0 16px;
      margin: 0;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    paper-item:not([disabled]):hover {
      background-color: var(--primary-background-color);
    }
    paper-item[disabled] {
      cursor: auto;
      color: var(--disabled-text-color);
    }
    .accent {
      color: var(--text-primary-color);
      background-color: var(--accent-color);
    }
    .buttons {
      padding: 10px 5px 10px 10px;
      @apply(--layout-horizontal);
      @apply(--layout-end-justified);
    }
  `

  render() {
    return html`
      <iron-meta id="meta" type="dialog"></iron-meta>
      <paper-dialog id="dialog" modal>
        <h2>${l10n('link_session_to_a_project')}</h2>
        <paper-dialog-scrollable>
          ${this.projects.map((project, index) => {
          return !!project.bookmark ? '' : html`
          <paper-item
            @click="${this._onLink}"
            ?data-session="${!!project.session}"
            data-project-id="${project.id}">
            <span class="flex title">${project.title}</span>
            <iron-icon icon="${!project.session ? '' : 'link'}"></iron-icon>
          </paper-item>
          `})}
        </paper-dialog-scrollable>
        <div class="buttons">
          <paper-button
            @click="${this.close}"
            raised>
            ${l10n('cancel')}
          </paper-button>
          ${!!this.linkingProject?.bookmark ? html`
          <paper-button
            class="accent"
            @click="${this._onUnlink}"
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
    linkingProject: ProjectEntity
  ) {
    this.linkingProject = linkingProject;
    // TODO: render
    this.dialog?.open();
  }

  public close() {
    this.dialog?.close();
  }

  private async _onLink(e: MouseEvent): Promise<void> {
    this.close();
    // already linked?
    const elem = e.target as HTMLElement;
    if (elem.dataset.session) {
      await this.meta?.byKey('confirm').confirm({
        line1: l10n('linked_project'),
        line2: l10n('confirm_breaking_link'),
        confirm: l10n('ok'),
        cancel: l10n('cancel')
      });
      this.fire('link-project', {
        srcprojid: this.linkingProject?.id,
        dstprojid: elem.dataset.projectId
      });
    } else {
      this.fire('link-project', {
        srcprojid: this.linkingProject?.id,
        dstprojid: elem.dataset.projectId
      });
    }
  }

  private _onUnlink(e: MouseEvent): void {
    // e.stoppropagation();
    this.close();
    this.fire('unlink-project', {
      targetproject: this.linkingProject,
    });
  }
}
