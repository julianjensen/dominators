# dominators

[![Coveralls Status][coveralls-image]][coveralls-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][depstat-image]][depstat-url]
[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![david-dm][david-dm-image]][david-dm-url]

> Various dominator tree generators.

## Remove This Section After Reading

Make sure you update this *README* file and remove this section. By using copious amount of *JSDoc* tags you can ensure good code documentation. This module supports the automatic generation of an API document by typing `npm run mddocs` which will create a document `API.md` which you can link to or concatenate to this *README.md* file.

It has also set up a unit test enviroment. Just type `npm test` to execute your unit tests which will be in the `test/` directory. It uses **mocha** and **chai** for testing.

It has `.gitignore`, `.editorconfig`, and `.eslintrc.json` files in the project root.

Here's how to finalize the **git** VCS for this project.

1. Create your repository on https://github.com/julianjensen/dominators (Your project directory is already init'd and staged for commit)
2. Type `git push -u origin master`

## Install

```sh
npm i dominators
```

## Usage

```js
const 
    dominators = require( 'dominators' );

dominators() // true
```

## License

MIT © [Julian Jensen](https://github.com/julianjensen/dominators)

[coveralls-url]: https://coveralls.io/github/julianjensen/dominators?branch=master
[coveralls-image]: https://coveralls.io/repos/github/julianjensen/dominators/badge.svg?branch=master

[travis-url]: https://travis-ci.org/julianjensen/dominators
[travis-image]: http://img.shields.io/travis/julianjensen/dominators.svg

[depstat-url]: https://gemnasium.com/github.com/julianjensen/dominators
[depstat-image]: https://gemnasium.com/badges/github.com/julianjensen/dominators.svg

[npm-url]: https://badge.fury.io/js/dominators
[npm-image]: https://badge.fury.io/js/dominators.svg

[license-url]: https://github.com/julianjensen/dominators/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg

[snyk-url]: https://snyk.io/test/github/julianjensen/dominators
[snyk-image]: https://snyk.io/test/github/julianjensen/dominators/badge.svg

[david-dm-url]: https://david-dm.org/julianjensen/dominators
[david-dm-image]: https://david-dm.org/julianjensen/dominators.svg
