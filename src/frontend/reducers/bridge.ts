
export const bridge = store => next => action => {
  let result = next(action);
  return result;
};
