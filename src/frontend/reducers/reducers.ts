import { combineReducers } from 'redux';

const controls = (state = [], action) => {

};

const projects = (state = [], action) => {
  switch (action.type) {
    case '':
  }
};

const config = (state = [], action) => {

};

const linker = (state = [], action) => {

};

const dialog = (state = [], action) => {

};

export const reducers = combineReducers({
  controls,
  config,
  linker,
  dialog,
  projects,
});
