# Alfred workflow for JIRA

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

## Development

To simplify development first put `./jira.alfredworkflow` file to Alfred Workflows, then go to the workflow folder which has been created (something like `~/Library/Mobile Documents/com~apple~CloudDocs/Documents/Alfred.alfredpreferences/workflows/user.workflow.C2556D26-B511-4486-9941-41459A884290`) and execute the script from it:

```bash
cd ..
ln -s /Users/puelle/Projects/alfred-jira/ WORFLOW_FOLDER_NAME
```

Enjoy!
