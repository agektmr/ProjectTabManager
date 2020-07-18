import { render } from 'lit-html';
import { store } from './store/store.js';
import { App } from './fragments/App.js';

store.dispatch(init());

const renderApp = () => {
  const state = store.getState();
  render(App(state.projects), document.querySelector('#app-container'));
}

store.subscribe(renderApp);

renderApp();
