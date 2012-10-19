var UpdateManager = {
  init: false,
  queue: [],
  addLoading: function(tabId) {
    UpdateManager.queue.push(tabId);
    if (config.debug) console.log('sync added loading tab to queue', UpdateManager.queue.length);
  },
  removeComplete: function(tabId) {
    for (var i = 0; i < UpdateManager.queue.length; i++) {
      if (UpdateManager.queue[i] === tabId) {
        UpdateManager.queue.splice(i, 1);
      }
    }
    if (config.debug) console.log('sync removed loading tab from queue', UpdateManager.queue.length);
    if (UpdateManager.queue.length === 0) {
      UpdateManager.sync();
    }
  },
  sync: function() {
    if (config.debug) console.log('start syncing.');
    // Execute only the first time.
    if (UpdateManager.init === false) {
      if (config.debug) console.log('start restoring from previous session.');
      TabManager.restorePreviousSession();
      UpdateManager.init = true;
    } else {
      chrome.storage.local.set(TabManager.export(), function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          if (config.debug) console.log('sessions stored.');
        }
      });
    }
    // TODO: result here doesn't match chrome.storage.local value. investigate what is the cause.
    if (config.debug) console.log('Current TabManager.projects status:', TabManager.projects);
    if (config.debug) console.log('Current TabManager.projectIds status:', TabManager.projectIds);
  }
};