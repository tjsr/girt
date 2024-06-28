# Github Repo Tool - A github repo config tool

`girt` is a tool intended to provide easy CLI commands for some actions that are not easily available using
the `gh` CLI tool.  These commands may require complex REST bodies to be submitted or GraphQL queries,
so `girt` commands shorten these to simple shorter usages.

## Installation

TBC.  For now, see [Building](#building)

## Usage

For a full explaination of usage and complete list of available options, use

```sh
girt --help
```

### Common commands

Use `--help` for full details of any command.

- `protect [options]` - Enable branch-protection for a repository.
- `login`
- `token`

#### Set basic branch-protection of current active branch

To enable branch-protection on the current branch and repository of the present working directory,
`girt protect`.  This assumes GITHUB_TOKEN is set in the current environment.  To specify it with
a switch, `girt protect -t ght_xxxxx`.

#### Set basic branch-protection of a repo in another directory

`girt protect -p ../my-git-dir` - This will read the repository details from the git repo at the
specified directory.

#### Login using the github CLI

`girt login` - Calls `gh auth login` then calls `gh auth token` to output the new token.  If a token is already set, no re-login attempt will be sent
unless the `-s`/`--skip-login` switch is provided.  This is effectively the
same as calling `girt token`.

#### Get the current github CLI API token

`girt token` - Calls `gh auth token` and outputs the currently used value.

## Building

```sh
npm ci
npm run build
```

To make the version you've built available to execute as a binary globally,

```sh
npm link
```

This enables you to simply call `girt` from anywhere that has your node_modules/bin on the path.

## About

Written by [Tim Rowe](mailto:tim@tjsr.id.au). Email me for questions or requests.

### Source code

Available at [https://github.com/tjsr/girt](https://github.com/tjsr/girt)

## Why 'girt'?

Only an Aussie could use a word which is basically never used and only occurs in our national anthem. ;)
