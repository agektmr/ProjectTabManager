import { html } from 'lit-html';
import './components/ptm-project-linker';

const linkProject = e => {

};

const unlinkProject = e => {

};

export const Linker = (state) => {
  return html`
    <ptm-project-linker
      id="linker"
      .projects="${state.projects}"
      @link-project="${linkProject}"
      @unlink-project="${unlinkProject}"></ptm-project-linker>
  `;
};
