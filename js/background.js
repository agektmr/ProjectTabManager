'use strict';

var windowManager = {};
var windowHistory = {};
// chrome.browserAction.setPopup({popup: 'popup.html'});
chrome.browserAction.setPopup({popup: 'ng-popup.html'});
chrome.windows.onRemoved.addListener(function(winId) {
  if (windowManager[winId]) delete windowManager[winId];
});
chrome.windows.onFocusChanged.addListener(VisibilityTracker.winChanged);
chrome.extension.onRequest.addListener(function(req, sender, callback) {
  switch (req.command) {
  case 'open':
    /* Try to open existing project window */
    for (var winId in windowManager) {
      if (windowManager[winId].id == req.projectId) {
        chrome.windows.update(parseInt(winId), {focused:true});
        return;
      }
    }
    /* Otherwise, create a new window with project tabs */
    ProjectTabManager.getBookmarks(req.projectId, function(bookmarks) {
      // avoid folder for first bookmark
      for (var s = 0; s < bookmarks.length; s++) {
        if (bookmarks[s].url) break;
      }
      if (s == bookmarks.length) return;
      // open first bookmark
      chrome.windows.create({
        url:bookmarks[s].url || null,
        focused:true
      }, function(win) {
        // register window to window manager
        ProjectTabManager.getProject(req.projectId, function(project) {
          windowManager[win.id] = project;
          windowHistory[win.id] = {};
          windowHistory[win.id].title = project.title;
        });
        // open bookmarks in window
        for (var i = s+1; i < bookmarks.length; i++) {
          // avoid folder
          if (bookmarks[i].children) continue;
          var url = localStorage.lazyLoad && localStorage.lazyLoad == 'true' ? bookmarks[i].url :
            'lazy.html?url='+encodeURIComponent(bookmarks[i].url)+
            '&title='+encodeURIComponent(bookmarks[i].title);
          chrome.tabs.create({
            windowId:win.id,
            url:url,
            active:false
          });
        }
      });
    });
    break;
  case 'pin':
    ProjectTabManager.getProject(req.projectId, function(project) {
      windowManager[req.winId] = project;
      windowHistory[req.winId] = {};
      windowHistory[req.winId].title = project.title;
      callback(project);
    });
    break;
  case 'deactivate':
    ProjectTabManager.moveToHiddenFolder(req.projectId, req.bookmarkId, callback);
    break;
  case 'activate':
    ProjectTabManager.moveFromHiddenFolder(req.projectId, req.bookmarkId, callback);
    break;
  case 'add':
    ProjectTabManager.addBookmark(req.projectId, req.tab, callback);
    break;
  case 'addProject':
    ProjectTabManager.addProject(req.name || 'New Project', function(newProject) {
      chrome.windows.getCurrent(function(win) {
        windowManager[win.id] = newProject;
        windowHistory[win.id] = {};
        windowHistory[win.id].title = newProject.title;
      });
      callback(newProject);
    });
    break;
  case 'remove':
    ProjectTabManager.removeBookmark(req.bookmarkId, callback);
    break;
  case 'removeProject':
    ProjectTabManager.removeProject(req.projectId, callback);
    break;
  case 'projects':
    ProjectTabManager.getProjectList(callback);
    break;
  case 'current':
    callback(windowManager[req.winId] && windowManager[req.winId].id || '0');
    break;
  case 'bookmarks':
    ProjectTabManager.getBookmarks(req.projectId, callback);
    break;
  case 'edit':
    ProjectTabManager.getRoot(function(root) {
      chrome.tabs.create({url:'chrome://bookmarks/#'+root.id});
    });
    break;
  case 'debug':
    callback(VisibilityTracker.getDebugInfo(windowHistory));
    break;
  case 'summary':
    callback(VisibilityTracker.getSummary(windowHistory));
    break;
  default:
    break;
  };
});
