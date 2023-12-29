import React from 'react';
import { Button, Tooltip, Input } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';

class JiraSiteUrl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editMode: false,
      siteURL: props.siteURL,
    };
  }

  changeJiraSiteUrl() {
    if (this.state.siteURL) {
      this.props.onChange(this.state.siteURL);
    }
    this.setState({ editMode: false });
  }

  render() {
    const { siteURL, editMode } = this.state;

    return (
      <div style={{ display: 'flex' }}>
        {editMode ? (
          <Input
            style={{ width: '300px' }}
            value={siteURL}
            onChange={(e) => this.setState({ siteURL: e.target.value })}
          />
        ) : (
          <h3>{siteURL}</h3>
        )}
        <Tooltip title="Change Jira URL">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              this.setState({ editMode: true });
            }}
            hidden={editMode}
          />
        </Tooltip>
        {editMode && (
          <Tooltip title="Save">
            <Button
              type="text"
              size="small"
              icon={<SaveOutlined />}
              onClick={() => this.changeJiraSiteUrl()}
            />
          </Tooltip>
        )}
      </div>
    );
  }
}

export default JiraSiteUrl;
