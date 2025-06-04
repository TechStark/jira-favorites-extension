import React from 'react';
import { Table, Input } from 'antd';
import { StarOutlined, StarFilled, EditOutlined } from '@ant-design/icons';
import TimeAgo from 'react-timeago';
import { createStarService } from '@/star';
import styles from './style.less';

const { TextArea } = Input;

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

const User = ({ user }) => {
  const { displayName, avatarUrl } = user || {};
  return (
    <span>
      <img className={styles.userAvatar} src={avatarUrl} alt={displayName} />
      <span style={{ marginLeft: '4px' }}>{displayName}</span>
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
      editingNoteKey: null,
      lastUpdatedNote: null,
    };
  }

  handleNoteEdit = (key) => {
    this.setState({ editingNoteKey: key });
  };

  handleNoteSave = async (key, value) => {
    const { issues } = this.props;
    const issue = issues.find(issue => issue.key === key);
    
    if (issue) {
      // Update the note property in the issue object to reflect changes immediately
      issue.note = value;
      
      const updatedIssue = { ...issue, note: value };
      await this.starService.addStar(key, updatedIssue);
      
      // Update state to trigger re-render
      this.setState({ 
        editingNoteKey: null,
        lastUpdatedNote: { key, value, timestamp: Date.now() } 
      });
    }
  };

  render() {
    const { site, issues } = this.props;
    const { unstarredKeys, editingNoteKey } = this.state;
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
              <TimeAgo date={record.time} title={new Date(record.time).toLocaleString()} />
            </div>
          );
        },
        sorter: (a, b) => a.time - b.time,
        defaultSortOrder: 'descend',
      },
      {
        title: 'Issue Key',
        align: 'left',
        width: 150,
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
        width: 150,
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
        width: 150,
        render: (text, record) => {
          const { updated } = record;
          return (
            <div>
              <TimeAgo date={updated} title={new Date(updated).toLocaleString()} />
            </div>
          );
        },
        sorter: (a, b) => {
          const getTime = (x) => new Date(x).getTime();
          return getTime(a.updated) - getTime(b.updated);
        },
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: 'Assignee',
        dataIndex: 'assignee',
        width: 200,
        render: (value) => {
          return <User user={value} />;
        },
        sorter: (a, b) => {
          const name1 = a.assignee?.displayName || '';
          const name2 = b.assignee?.displayName || '';
          return name1.localeCompare(name2);
        },
      },
      {
        title: 'Reporter',
        dataIndex: 'creator',
        width: 200,
        render: (value) => {
          return <User user={value} />;
        },
        sorter: (a, b) => {
          const name1 = a.creator?.displayName || '';
          const name2 = b.creator?.displayName || '';
          return name1.localeCompare(name2);
        },
      },
      {
        title: 'Note',
        dataIndex: 'note',
        width: 300,
        render: (value, record) => {
          const { key } = record;
          const isEditing = editingNoteKey === key;
          
          if (isEditing) {
            return (
              <TextArea
                autoFocus
                defaultValue={value || ''}
                autoSize={{ minRows: 1, maxRows: 5 }}
                onBlur={(e) => this.handleNoteSave(key, e.target.value)}
                onKeyDown={(e) => {
                  // Save and exit edit mode when Ctrl+Enter or Command+Enter is pressed
                  if ((e.ctrlKey || e.metaKey) && e.keyCode === 13) {
                    this.handleNoteSave(key, e.target.value);
                  }
                }}
              />
            );
          }
          
          return (
            <div className={styles.noteCell}>
              <div style={{ paddingRight: '25px' }}>{value || ''}</div>
              <EditOutlined 
                className={styles.noteEditIcon} 
                style={{ opacity: 0, transition: 'opacity 0.3s' }} 
                onClick={() => this.handleNoteEdit(key)} 
              />
            </div>
          );
        },
      },
    ];

    return (
      <div>
        <Table 
          size="small" 
          columns={columns} 
          dataSource={issues} 
          pagination={false}
          rowClassName={() => styles.tableRow}
          onRow={(record) => ({
            onMouseEnter: () => {
              // We could add additional row hover handling here if needed
            },
            onMouseLeave: () => {
              // We could add additional row hover handling here if needed
            },
          })}
        />
      </div>
    );
  }
}

export default IssueList;
