import { render } from 'lit-html';
import { store } from './store/store';
import { App } from './fragments/App';
import { AppState } from './store/types';
import { initApp } from './actions/app';

store.dispatch(initApp());

const renderApp = (): void => {
  const state = store.getState() as unknown;
  const container = document.querySelector('#app-container');
  if (!container) return;
  render(App(<AppState>state), container);
}

store.subscribe(renderApp);

renderApp();
