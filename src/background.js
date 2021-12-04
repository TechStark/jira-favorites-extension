chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'hidePageAction') {
    // chrome.pageAction.hide(sender.tab.id);
  }
});

chrome.browserAction.onClicked.addListener(function (activeTab) {
  chrome.tabs.create({ url: chrome.runtime.getURL('starList.html') }, function (tab) {
    // Tab opened.
  });
});
