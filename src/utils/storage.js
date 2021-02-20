function checkLastError() {
  const error = chrome.runtime.lastError;
  if (error) {
    // console.error(error.message || error);
    throw new Error(error.message || error);
  }
}

export function readContent(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, function (items) {
      checkLastError();
      resolve(items);
    });
  });
}

export function writeContent(obj) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(obj, function () {
      checkLastError();
      resolve();
    });
  });
}

export function removeContent(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(keys, function (result) {
      checkLastError();
      resolve(result);
    });
  });
}
