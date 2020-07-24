import { createStore, applyMiddleware } from 'redux';
import { bridge } from './bridge';
import { reducers } from '../reducers/reducers';

export const store = createStore(reducers, applyMiddleware(bridge));
