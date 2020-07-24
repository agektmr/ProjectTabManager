import { render } from 'lit-html';
import { store } from './store/store';
import { App } from './fragments/App';
import { AppState } from './store/types';
import { initApp } from './store/actions';

store.dispatch(initApp());

const renderApp = (): void => {
  const state = <AppState>store.getState();
  const container = document.querySelector('#app-container');
  if (!container) return;
  render(App(state), container);
}

store.subscribe(renderApp);

renderApp();
