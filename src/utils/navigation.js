class HistoryState {
  constructor() {
    this.listeners = [];
    this.listenToUrlChange();
  }

  listenToUrlChange = () => {
    let currentURL = window.location.href;

    const observer = new MutationObserver(() => {
      if (currentURL !== window.location.href) {
        currentURL = window.location.href;
        this.triggerEvent();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  triggerEvent = (event) => {
    for (const listener of this.listeners) {
      listener(event);
    }
  };

  addListener = (listener) => {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    } else {
      throw new Error(`Argument for "addListener" must be a function`);
    }
  };

  removeListener = (listener) => {
    const index = this.listeners.findIndex((l) => l === listener);
    if (index >= 0) {
      this.listeners.splice(index);
    }
  };
}

const onHistoryStateUpdated = new HistoryState();

// eslint-disable-next-line import/prefer-default-export
export { onHistoryStateUpdated };
