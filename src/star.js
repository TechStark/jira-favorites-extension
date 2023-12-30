import { readContent, writeContent, removeContent } from '@/utils/storage';

/**
 * 
 * items in the Chrome storage
{
    "s0.CDWEB-6101": {
        "key": "CDWEB-6101",
        "time": 1584415446988,
        "title": "CDJS is using synchronous request (sync-xhr) to get nickname index file"
    },
    "s0.CLN-4085": {
        "key": "CLN-4085",
        "time": 1583910495991,
        "title": "As a user, I want density or molarity to be populated in the stoich grid from ChemACX"
    },
    "sites": ["https://jira-ext.perkinelmer.com", "http://jira.perkinelmer.net:8080"]
}
 * 
 */

const sitesKey = 'sites'; // ["https://xx.com", "http://abc.com"]

function readSites() {
  return readContent(sitesKey).then((item) => item[sitesKey] || []);
}

function saveSites(sites) {
  return writeContent({ [sitesKey]: sites });
}

function getSiteKey(siteURL, needSave) {
  return readSites().then((sites) => {
    let index = sites.findIndex((url) => url === siteURL);
    if (index >= 0) {
      return index;
    }
    if (needSave) {
      // save the new site
      const emptyIndex = sites.indexOf('');
      if (emptyIndex >= 0) {
        // reuse index of empty slot
        sites[emptyIndex] = siteURL;
        return saveSites(sites).then(() => emptyIndex);
      } else {
        index = sites.length;
        sites.push(siteURL);
        return saveSites(sites).then(() => index);
      }
    }
    return -1;
  });
}

export function createStarService(siteURL) {
  const formatIssueKey = (siteKey, issueKey) => `s${siteKey}.${issueKey}`;

  const getStoreKey = (issueKey, needSave) =>
    getSiteKey(siteURL, needSave).then((siteKey) => formatIssueKey(siteKey, issueKey));

  const getStar = (issueKey) =>
    getStoreKey(issueKey).then((key) => readContent(key).then((item) => item[key]));

  const removeStar = (issueKey) => getStoreKey(issueKey).then((key) => removeContent(key));

  const addStar = (issueKey, favorite) =>
    getStoreKey(issueKey, true).then((key) =>
      writeContent({ [key]: favorite }).then(() => favorite)
    );

  const bulkSave = async (issues) => {
    const data = {};
    const siteKey = await getSiteKey(siteURL, true);
    issues.forEach((issue) => {
      const key = formatIssueKey(siteKey, issue.key);
      data[key] = issue;
    });
    await writeContent(data);
    return issues;
  };

  return {
    getStar,
    removeStar,
    addStar,
    bulkSave,
  };
}
