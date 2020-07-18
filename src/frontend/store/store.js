import { createStore, applyMiddleware } from 'redux';
import { bridge } from './reducers/bridge.ts';
import { reducers } from '../reducers/reducers.ts';

export const store = createStore(reducers, applyMiddleware(bridge));
