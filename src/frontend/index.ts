/** @format */

import { render } from 'lit-html';
import { store } from './store/store';
import { App } from './fragments/App';
import { AppState } from './store/types';
import { init } from './actions/app';

import { Menu } from '@material/mwc-menu';

store.dispatch(init());

const renderApp = (): void => {
  const state = store.getState();
  const container = document.querySelector('#app-container');
  if (!container) return;
  render(App(state.app), container);
};

store.subscribe(renderApp);

renderApp();

const menu: Menu = document.querySelector('#menu-list');
const button: HTMLButtonElement = document.querySelector('#menu-button');
if (menu && button) {
  menu.anchor = button;
  button.addEventListener('click', (e) => {
    menu.open = true;
  });
}
