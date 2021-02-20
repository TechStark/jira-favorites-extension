import React from 'react';
import { ClockCircleOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import TimeAgo from 'react-timeago';
import { createStarService } from '@/star';
import styles from './style.less';

class IssueList extends React.Component {
  constructor(props) {
    super(props);
    const { site } = props;
    this.starService = createStarService(site);
    this.state = {
      unstarredKeys: [],
    };
  }

  render() {
    const { site, issues } = this.props;
    const { unstarredKeys } = this.state;
    const { addStar, removeStar } = this.starService;

    const isStarred = (key) => {
      if (unstarredKeys.indexOf(key) >= 0) {
        return false;
      }
      return true;
    };

    const StarIcon = ({ issueKey, starred }) => {
      return (
        <span style={{ marginRight: '6px' }}>
          {starred ? (
            <StarFilled
              className={styles.starIcon}
              style={{ color: 'orange' }}
              onClick={() => {
                removeStar(issueKey).then(() => {
                  unstarredKeys.push(issueKey);
                  this.setState({ unstarredKeys });
                });
              }}
            />
          ) : (
            <StarOutlined
              className={styles.starIcon}
              onClick={() => {
                const favorite = issues.filter((x) => x.key === issueKey)[0];
                addStar(issueKey, favorite).then(() => {
                  const newUnstarredKeys = unstarredKeys.filter((x) => x !== issueKey);
                  this.setState({ unstarredKeys: newUnstarredKeys });
                });
              }}
            />
          )}
        </span>
      );
    };

    return (
      <div>
        {issues
          .sort((a, b) => {
            if (a.time - b.time > 0) {
              return -1;
            } else if (a.time - b.time < 0) {
              return 1;
            } else {
              return 0;
            }
          })
          .map(({ key, title, time }) => {
            const starred = isStarred(key);
            return (
              <div key={key} className={styles.row}>
                <div>
                  <StarIcon issueKey={key} starred={starred} />
                  <a target="_blank" rel="noopener noreferrer" href={`${site}/browse/${key}`}>
                    {key}
                  </a>
                  : <span>{title}</span>
                </div>
                <div style={{ paddingLeft: '20px' }}>
                  <span>
                    <ClockCircleOutlined style={{ marginRight: '4px', color: '#ccc' }} />
                    <span title={new Date(time)}>
                      starred <TimeAgo date={time} />
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    );
  }
}

export default IssueList;
