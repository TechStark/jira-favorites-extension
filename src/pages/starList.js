import React from 'react';
import * as R from 'ramda';
import { createRoot } from 'react-dom/client';
import { Button, Tooltip } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import IssueList from '@/components/IssueList';
import JiraSiteUrl from '@/components/JiraSiteUrl';
import { createStarService } from '@/star';
import { readContent, writeContent, removeContent } from '@/utils/storage';
import * as api from '@/api/jira';

import 'antd/dist/reset.css';

class StarList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sites: [],
      siteIssues: {},
      isUpdating: false,
    };
  }

  componentDidMount() {
    this.reloadData();
  }

  async reloadData() {
    const items = await readContent(null);
    const sites = items.sites || [];
    const siteIssues = {};
    for (let i = 0; i < sites.length; i++) {
      const siteURL = sites[i];
      const issueKeyPrefix = `s${i}.`;
      const issues = Object.keys(items)
        .filter((key) => key.indexOf(issueKeyPrefix) === 0)
        .map((key) => items[key]);
      siteIssues[siteURL] = issues;
    }
    const sitesWithCards = sites.filter((url) => siteIssues[url].length > 0);
    this.setState({ sites: sitesWithCards, siteIssues });
  }

  updateIssues(siteURL, issues) {
    const starService = createStarService(siteURL);
    this.setState({ isUpdating: true });
    const promises = issues.map(async (issue) => {
      const { key } = issue;
      try {
        const newIssue = await api.getIssueInfo(key, siteURL);
        return R.mergeRight(issue, newIssue);
      } catch (error) {
        console.error('failed to get issue info', error);
        // existing issue
        return issue;
      }
    });
    Promise.all(promises)
      .then((issues) => {
        // console.log(issues);
        return starService.bulkSave(issues);
      })
      .then((issues) => {
        this.setState({
          siteIssues: R.assoc(siteURL, issues, this.state.siteIssues),
        });
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.setState({ isUpdating: false });
      });
  }

  async changeSiteUrl(siteUrl, newUrl) {
    if (siteUrl === newUrl) {
      return;
    }

    const items = await readContent(null);
    const sites = items.sites || [];

    const targetSiteIndex = sites.indexOf(siteUrl);
    if (targetSiteIndex < 0) {
      return;
    }

    const existingSiteIndex = sites.indexOf(newUrl);
    if (existingSiteIndex >= 0) {
      // set target site URL to ""
      const newSites = R.assocPath([targetSiteIndex], '', sites);
      // move issues in target site to the existing one
      const oldIssueKeyPrefix = `s${targetSiteIndex}.`;
      const newIssueKeyPrefix = `s${existingSiteIndex}.`;
      const oldIssueKeys = Object.keys(items).filter((key) => key.startsWith(oldIssueKeyPrefix));
      const newIssueKeys = oldIssueKeys.map((key) =>
        key.replace(oldIssueKeyPrefix, newIssueKeyPrefix)
      );
      const newIssueValues = oldIssueKeys.map((key) => items[key]);
      const newIssueItems = R.zipObj(newIssueKeys, newIssueValues);

      // save new content
      await writeContent({ ...newIssueItems, sites: newSites });
      // delete old issues
      await removeContent(oldIssueKeys);
    } else {
      // simply change site URL
      await writeContent({ sites: R.assocPath([targetSiteIndex], newUrl, sites) });
    }

    this.reloadData();
  }

  render() {
    const { sites, siteIssues, isUpdating } = this.state;

    return (
      <div>
        <h2>Jira Favorites</h2>
        {sites.length === 0 && <div>No Favorite Items</div>}
        {sites.map((siteURL) => (
          <div key={siteURL}>
            <div style={{ display: 'flex', marginTop: '2em' }}>
              <JiraSiteUrl
                siteURL={siteURL}
                onChange={(newUrl) => {
                  this.changeSiteUrl(siteURL, newUrl);
                }}
                onRefreshIssues={() => {
                  this.updateIssues(siteURL, siteIssues[siteURL]);
                }}
              />
              <Tooltip title="Update tickets from Jira">
                <Button
                  shape="circle"
                  size="small"
                  icon={<SyncOutlined />}
                  style={{ marginLeft: '1em' }}
                  onClick={() => this.updateIssues(siteURL, siteIssues[siteURL])}
                  loading={isUpdating}
                />
              </Tooltip>
            </div>
            <IssueList site={siteURL} issues={siteIssues[siteURL]} />
          </div>
        ))}
      </div>
    );
  }
}

const root = createRoot(document.getElementById('root'));
root.render(<StarList />);
