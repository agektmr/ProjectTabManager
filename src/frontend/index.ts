import { render } from 'lit-html';
import { store } from './store/store';
import { App } from './fragments/App';

// store.dispatch(init());

const renderApp = (): void => {
  const state = store.getState();
  render(App(state), document.querySelector('#app-container'));
}

store.subscribe(renderApp);

renderApp();
