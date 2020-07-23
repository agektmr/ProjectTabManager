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
import { l10n } from '../ChromeL10N';
import { ProjectEntity } from "../../background/ProjectEntity";

import '@polymer/iron-meta/iron-meta.js';
import '@material/mwc-dialog';
import '@material/mwc-button';
import '@material/mwc-list';
import '@material/mwc-icon-button';
import './ptm-list-item';

import { PtmBase } from './ptm-base';
import { IronMetaElement } from '@polymer/iron-meta';
import { Dialog } from '@material/mwc-dialog';

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
  dialog: Dialog | undefined

  render() {
    return html`
      <style>
        /* h2 {
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
        } */
        .title {
          cursor: pointer;
          color: var(--secondary-text-color);
        }
        /* paper-button {
          color: var(--text-primary-color);
          background-color: var(--default-primary-color);
        } */
        ptm-list-item {
          --mdc-list-side-padding: 0;
        }
      </style>
      <iron-meta id="meta" type="dialog"></iron-meta>
      <mwc-dialog id="dialog" heading="${l10n('link_session_to_a_project')}">
        <mwc-list>
          ${this.projects.map(project => {
          return !!project.bookmark ? html`
          <ptm-list-item
            @click="${this.onLink}"
            ?data-session="${!!project.session}"
            data-project-id="${project.id}"
            hasMeta>
            <span class="title">${project.title}</span>
            <mwc-icon-button slot="meta">
              ${project.session ? html`<img src="../img/link.svg">` : ``}
            </mwc-icon-button>
          </ptm-list-item>
          ` : ''})}
        </mwc-list>
        <mwc-button
          slot="secondaryAction"
          @click="${this.close}">
          ${l10n('cancel')}
        </mwc-button>
        ${this.linkingProjectId ? html`
        <mwc-button
          slot="primaryAction"
          @click="${this.onUnlink}">
          ${l10n('unlink')}
        </mwc-button>`: ''}
      </mwc-dialog>`;
  }

  public firstUpdated() {
    this.meta = this.querySelector('#meta');
    this.dialog = this.querySelector('#dialog');
  }

  public open(
    linkingProjectId: string,
    bookmarked: boolean
  ) {
    this.linkingProjectId = linkingProjectId;
    this.bookmarked = bookmarked;
    this.dialog?.show();
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
