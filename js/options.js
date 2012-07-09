var $ = function(query) {
  return document.querySelector(query);
};
window.onload = function() {
  $('#folderName').value = localStorage.rootName || 'Project Tab Manager';
  $('#lazyLoad').checked = localStorage.lazyLoad ? true : false;
  chrome.bookmarks.getSubTree('0', function(bookmarks) {
    for (var i = 0; i < bookmarks[0].children.length; i++) {
      var bookmark = bookmarks[0].children[i];
      var option = document.createElement('option');
      option.value = bookmark.id;
      option.innerHTML = bookmark.title;
      if (localStorage.rootParentId == bookmark.id) option.selected = true;
      $('#root').appendChild(option);
    };
  });
  $('#save').onclick = function() {
    localStorage.rootParentId = $('#root').value;
    localStorage.rootName = $('#folderName').value;
    localStorage.lazyLoad = $('#lazyLoad').checked ? 'true' : '';
    alert('Project location saved!');
  };
};