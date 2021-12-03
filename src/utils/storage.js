export function readContent(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, function (items) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(items);
      }
    });
  });
}

export function writeContent(obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(obj, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export function removeContent(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(keys, function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}
