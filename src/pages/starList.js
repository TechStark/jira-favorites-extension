import React from 'react';
import { render } from 'react-dom';
import IssueList from '@/components/IssueList';

class StarList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sites: [],
      siteIssues: {},
    };
  }

  componentDidMount() {
    chrome.storage.sync.get(null, (items) => {
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
    });
  }

  render() {
    const { sites, siteIssues } = this.state;

    return (
      <div>
        <h2>Jira Favorites</h2>
        {sites.length === 0 && <div>No Favorite Items</div>}
        {sites.map((siteURL) => (
          <div key={siteURL}>
            <h3>{siteURL}</h3>
            <IssueList site={siteURL} issues={siteIssues[siteURL]} />
          </div>
        ))}
      </div>
    );
  }
}

render(<StarList />, document.getElementById('root'));
