import $ from 'jquery';
import { throttle } from 'lodash';
import hotkeys from 'hotkeys-js';
import { createStarService } from './star';

const { getStar, addStar, removeStar } = createStarService(window.location.origin);

function getIssueKey() {
  const matches = window.location.href.match(/\/browse\/([\w-]+)\b/);
  return matches && matches[1];
}

const toolsQueryV1 = '#opsbar-jira\\.issue\\.tools'; // on prem version
const toolsQueryV2 = '#jira-issue-header-actions > div > div'; // jira cloud version

let jiraVersion = '';
let isStarred = false;
let starButton;

function initStarButton() {
  const issueKey = getIssueKey();
  if (!issueKey) {
    return;
  }

  let tools;
  if ((tools = $(toolsQueryV1)).length > 0) {
    jiraVersion = 'V1';
  } else if ((tools = $(toolsQueryV2)).length > 0) {
    jiraVersion = 'V2';
  }

  if (!jiraVersion) {
    // unsupported version
    return;
  }

  if (tools.length > 0) {
    starButton = createStarButton().on('click', toggleStar);
    tools.append(starButton);
    getStar(issueKey).then(updateButtonState);
  }
}

function createStarButton() {
  return $(`
      <a class="jira-star aui-button toolbar-trigger">
        <span class="icon aui-icon aui-icon-small aui-iconfont-unstar" />
      </a>
      `);
}

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

async function toggleStar() {
  const issueKey = getIssueKey();
  if (isStarred) {
    removeStar(issueKey).then(updateButtonState);
  } else {
    const issueInfo = await getJiraIssueInfo();
    const favorite = {
      ...issueInfo,
      key: issueKey,
      time: Date.now(),
    };
    addStar(issueKey, favorite).then(updateButtonState);
  }
}

async function getJiraIssueInfo() {
  switch (jiraVersion) {
    case 'V1': {
      const title = $('#summary-val').text();
      const status = $('#status-val').text().trim();
      const updated = $('#updated-val time').attr('datetime');
      return { title, status, updated };
    }
    case 'V2': {
      const title = $('[data-testid="issue.views.issue-base.foundation.summary.heading"]').text();
      const status = $('#issue\\.fields\\.status-view\\.status-button').text().trim();
      // e.g. Updated December 15, 2023 at 10:11 AM
      const updatedText = $('[data-testid="updated-date.ui.read.meta-date"]').text();
      const dateTimeStr = updatedText.replace('Updated ', '').replace(' at ', ' ');
      const dt = new Date(dateTimeStr);
      const updated = isNaN(dt.getTime()) ? '' : dt.toISOString();
      return { title, status, updated };
    }
    default:
      console.log('Unknown JIRA version', jiraVersion);
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
  // register keyboard shortcut
  hotkeys('alt+shift+f', function (event, handler) {
    toggleStar();
  });
}

function isJira() {
  const meta = document.querySelector('meta[name="application-name"][content="JIRA"]');
  return !!meta;
}

// ensure this extension can run
if (isJira() && getIssueKey()) {
  init();
} else {
  // gray out extension icon
  // chrome.runtime.sendMessage({ type: 'hidePageAction' });
}
