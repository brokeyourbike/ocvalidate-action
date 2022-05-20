# ocvalidate-action

[![Latest Stable Version](https://img.shields.io/github/v/release/brokeyourbike/ocvalidate-action)](https://github.com/brokeyourbike/ocvalidate-action/releases)
[![Maintainability](https://api.codeclimate.com/v1/badges/e42026748cce6e8b194d/maintainability)](https://codeclimate.com/github/brokeyourbike/ocvalidate-action/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/e42026748cce6e8b194d/test_coverage)](https://codeclimate.com/github/brokeyourbike/ocvalidate-action/test_coverage)

Set up your GitHub Actions workflow with a specific version of [ocvalidate](https://github.com/acidanthera/OpenCorePkg/tree/master/Utilities/ocvalidate) from the [OpenCore](https://github.com/acidanthera/OpenCorePkg)

## Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
  - uses: actions/checkout@v3
  - uses: brokeyourbike/ocvalidate-action@v0
    with:
      opencore-version: '0.8.0' # OpenCore version to download and use.
  - run: ocvalidate config.plist | grep -q 'No issues found'
```

## Authors
- [Ivan Stasiuk](https://github.com/brokeyourbike) | [Twitter](https://twitter.com/brokeyourbike) | [stasi.uk](https://stasi.uk)


## License

The scripts and documentation in this project are released under the [MPL-2.0](https://github.com/brokeyourbike/ocvalidate-action/blob/main/LICENSE)
