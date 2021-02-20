import $ from 'jquery';
import { onHistoryStateUpdated } from '@/utils/navigation';
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
    getStar(issueKey).then(updateState);
  }
}

$(document).on('keypress', (e) => {
  if (e.key === 'f') {
    const tagName = $(e.target).prop('tagName');
    if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(tagName) === -1) {
      toggleStar();
    }
  }
});

function updateState(favorite) {
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
    removeStar(issueKey).then(updateState);
  } else {
    const summary = $('#summary-val').text();
    const favorite = { key: issueKey, title: summary, time: Date.now() };
    addStar(issueKey, favorite).then(updateState);
  }
}

function handleUrlChange() {
  let isCheckPageRunning = false;
  let continueExistingCount = 0;

  onHistoryStateUpdated.addListener(() => {
    continueExistingCount = 0;
    checkPage();
  });

  const checkPage = () => {
    if (isCheckPageRunning) {
      // ensure only one timer
      return;
    }
    isCheckPageRunning = true;
    setTimeout(() => {
      isCheckPageRunning = false;
      const existing = $(toolsQeury).find('.jira-star').length > 0;
      if (!existing) {
        initStarButton();
        continueExistingCount = 0;
      } else {
        continueExistingCount++;
      }
      if (continueExistingCount < 100) {
        // continue monitoring the page for 10 seconds
        checkPage();
      }
    }, 100);
  };
}

function init() {
  initStarButton();
  // on URL changed via AJAX, ensure star button is still inserted
  handleUrlChange();
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
