import React from 'react';
import { Table } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import TimeAgo from 'react-timeago';
import { createStarService } from '@/star';
import styles from './style.less';

const StarIcon = ({ starred, onClick }) => {
  return (
    <span style={{ marginRight: '6px' }}>
      {starred ? (
        <StarFilled className={styles.starIcon} style={{ color: 'orange' }} onClick={onClick} />
      ) : (
        <StarOutlined className={styles.starIcon} onClick={onClick} />
      )}
    </span>
  );
};

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

    const handleStarIconClick = (key, starred) => {
      if (starred) {
        removeStar(key).then(() => {
          unstarredKeys.push(key);
          this.setState({ unstarredKeys });
        });
      } else {
        const favorite = issues.filter((x) => x.key === key)[0];
        addStar(key, favorite).then(() => {
          const newUnstarredKeys = unstarredKeys.filter((x) => x !== key);
          this.setState({ unstarredKeys: newUnstarredKeys });
        });
      }
    };

    const columns = [
      {
        title: 'Starred Time',
        align: 'left',
        width: 150,
        render: (text, record) => {
          const { key } = record;
          const starred = isStarred(key);
          return (
            <div>
              <StarIcon starred={starred} onClick={() => handleStarIconClick(key, starred)} />
              <TimeAgo date={record.time} />
            </div>
          );
        },
        sorter: (a, b) => a.time - b.time,
        defaultSortOrder: 'descend',
      },
      {
        title: 'Issue Key',
        align: 'left',
        width: 160,
        render: (text, record) => {
          const { key } = record;
          return (
            <a target="_blank" rel="noopener noreferrer" href={`${site}/browse/${key}`}>
              {key}
            </a>
          );
        },
      },
      {
        title: 'Title',
        dataIndex: 'title',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        sorter: (a, b) => {
          if (a.status < b.status) {
            return -1;
          }
          if (a.status > b.status) {
            return 1;
          }
          return 0;
        },
      },
      {
        title: 'Updated Time',
        render: (text, record) => {
          const { updated } = record;
          return (
            <div>
              <TimeAgo date={updated} />
            </div>
          );
        },
        sorter: (a, b) => {
          const getTime = (x) => new Date(x).getTime();
          return getTime(a.updated) - getTime(b.updated);
        },
        sortDirections: ['descend', 'ascend'],
      },
    ];

    return (
      <div>
        <Table size="small" columns={columns} dataSource={issues} pagination={false} />
      </div>
    );
  }
}

export default IssueList;
