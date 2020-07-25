import { combineReducers } from 'redux';
import { controls } from './app';
import { dialog } from './dialog';
import { linker } from './linker';
import { options } from './options';
import { projects } from './projects';

export const reducers = combineReducers({
  controls,
  options,
  linker,
  dialog,
  projects,
});
