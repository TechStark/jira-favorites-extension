export function getIssueInfo(issueKey, siteURL = '') {
  return fetch(`${siteURL}/rest/api/2/issue/${issueKey}`, {
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
      const info = {
        title: summary,
        status: statusName,
        updated,
      };
      return info;
    });
}
