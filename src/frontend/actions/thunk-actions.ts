export const init = (): Promise<any> => {
  return async (dispatch): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
    const [ rootFolders ] = await Promise.all([
      new Promise((resolve) => {
        chrome.bookmarks.getSubTree('0', bookmarks => {
          const rootFolders = bookmarks[0].children;
          resolve(rootFolders);
        })
      })
    ]);
    return { rootFolders };
  }
}

export const requestBackend = (
  commandName: string,
  commandDetail: any
): Promise<any> => {
  return new Promise((resolve, reject) =>
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
  );
}
