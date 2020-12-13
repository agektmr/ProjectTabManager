/** @format */

import { Middleware, MiddlewareAPI, Dispatch, AnyAction, Store } from 'redux';

export const bridge = <S extends Store>( // TODO: Is "Store" correct?
  store: MiddlewareAPI<Dispatch, S>,
) => (next: Dispatch<AnyAction>) => (action: any): Middleware => {
  let result = next(action);
  return result;
};
