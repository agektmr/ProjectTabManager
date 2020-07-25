import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { reducers } from '../reducers/reducers';

const logger = createLogger();
const middlewares = [thunk, logger];

export const store = createStore(reducers, applyMiddleware(...middlewares));
