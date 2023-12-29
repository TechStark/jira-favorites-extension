import React from 'react';
import * as R from 'ramda';
import { render } from 'react-dom';
import { Button, Tooltip } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import IssueList from '@/components/IssueList';
import JiraSiteUrl from '@/components/JiraSiteUrl';
import { createStarService } from '@/star';
import { readContent, writeContent } from '@/utils/storage';

import 'antd/dist/antd.css';

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
    const promises = issues.map((issue) => {
      const { key } = issue;
      return fetch(`${siteURL}/rest/api/2/issue/${key}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((item) => {
          const { fields } = item;
          const { summary, status, updated } = fields;
          const { name: statusName } = status;
          const newIssue = {
            title: summary,
            status: statusName,
            updated,
          };
          return R.mergeRight(issue, newIssue);
        });
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
    const items = await readContent(null);
    const sites = items.sites || [];
    const newSites = sites.map((url) => {
      if (url === siteUrl) {
        return newUrl;
      }
      return url;
    });
    await writeContent({ sites: newSites });
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

render(<StarList />, document.getElementById('root'));
