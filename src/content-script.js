import $ from 'jquery';
import { throttle } from 'lodash';
import { createStarService } from './star';

const { getStar, addStar, removeStar } = createStarService(window.location.origin);

function getIssueKey() {
  const matches = window.location.href.match(/\/browse\/([\w-]+)\b/);
  return matches && matches[1];
}

const toolsQeury = '#opsbar-jira\\.issue\\.tools';

let isStarred = false;
let starButton;

function initStarButton() {
  const issueKey = getIssueKey();
  const tools = $(toolsQeury);
  if (issueKey && tools.length > 0) {
    starButton = $(`
    <a class="jira-star aui-button toolbar-trigger">
      <span class="icon aui-icon aui-icon-small aui-iconfont-unstar" />
    </a>
    `).on('click', toggleStar);
    tools.append(starButton);
    getStar(issueKey).then(updateButtonState);
  }
}

$(document).on('keypress', (e) => {
  // Alt + Shift + F to toggle star
  if (e.altKey && e.shiftKey && e.code === 'KeyF') {
    toggleStar();
  }
});

function updateButtonState(favorite) {
  isStarred = (favorite && favorite.key === getIssueKey()) || false;
  if (isStarred) {
    starButton.attr('title', 'Remove from favorites');
    starButton
      .find('.aui-icon')
      .css('color', 'orange')
      .addClass('aui-iconfont-star')
      .removeClass('aui-iconfont-unstar');
  } else {
    starButton.attr('title', 'Add to favorites');
    starButton
      .find('.aui-icon')
      .css('color', '')
      .addClass('aui-iconfont-unstar')
      .removeClass('aui-iconfont-star');
  }
}

function toggleStar() {
  const issueKey = getIssueKey();
  if (isStarred) {
    removeStar(issueKey).then(updateButtonState);
  } else {
    const summary = $('#summary-val').text();
    const status = $('#status-val').text().trim();
    const updated = $('#updated-val time').attr('datetime');
    const favorite = {
      key: issueKey,
      title: summary,
      time: Date.now(),
      status,
      updated,
    };
    addStar(issueKey, favorite).then(updateButtonState);
  }
}

function monitorPageChange() {
  const handler = throttle(() => {
    if (starButton == null || !starButton[0].isConnected) {
      initStarButton();
    }
  }, 200);
  const observer = new MutationObserver(handler);
  observer.observe(document.body, { subtree: true, childList: true });
}

function init() {
  initStarButton();
  // after page content changed, ensure star button is still inserted
  monitorPageChange();
}

function isJira() {
  const meta = document.head.querySelector('meta[name="application-name"][content="JIRA"]');
  return !!meta;
}

// ensure this extension can run
if (isJira() && getIssueKey()) {
  init();
} else {
  // gray out extension icon
  // chrome.runtime.sendMessage({ type: 'hidePageAction' });
}
