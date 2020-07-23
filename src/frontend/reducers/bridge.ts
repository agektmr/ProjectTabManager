
export const bridge = (store) => (next) => (action): Middleware => {
  let result = next(action);
  return result;
};
