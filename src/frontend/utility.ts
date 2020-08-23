export const requestBackend = (
  commandName: string,
  commandDetail: any
): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      command: commandName,
      detail: commandDetail
    }, response => {
      if (!response) {
        // result being `undefined` is safe
        resolve();
      } else if (response.error) {
        reject(response.error);
      } else {
        resolve(response.result)
      }
    })
  });
}