Alfred workflow for JIRA
=========================================
## Capabilities
This workflow is able to display JIRA ticket's summary, current status, assignee and last 20 comments.

Typing `j TICKET_NUMBER` you'll view all this info in the alfred manner.

## Installation
To install this workflow please download the latest `jira.alfredworkflow` file from the repo [releases](https://github.com/pmyagkov/alfred-jira/releases).
Then click to the downloaded file and add the workflow to alfred.

## Configuration
To connect to JIRA the script needs base url of the jira instance, username, password and default project key (like 'JIRA'). It tries to read this info from the `~/.config/alfred-jira/alfred-jira` config file.
This file should be formatted in the following manner:
```
https://jira.instance.com
username
password
defaultProject
```

To start using this workflow please create the config file and provide actual info for your jira instance and user.

Enjoy!
