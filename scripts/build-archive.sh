#!/bin/bash
zip -r jira.alfredworkflow . -x .git/**\* .history/**\* package.json package-lock.json
