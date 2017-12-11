# dominators

[![Coveralls Status][coveralls-image]][coveralls-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][depstat-image]][depstat-url]
[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![david-dm][david-dm-image]][david-dm-url]

> Various dominator tree generators.

It implements two different methods for finding the immediate dominators of a graph.

1. Implements a near-linear time iterative dominator generator based on the
    paper [A Simple, Fast Dominance Algorithm](https://www.cs.rice.edu/~keith/Embed/dom.pdf) using an iterative method<a href="#chk" id="chkref"><sup>1</sup></a>
    
2. Yet another Lengauer & Tarjan implementation with variations. From this paper<a href="#lt" id="ltref"><sup>2</sup></a> which you can find a link to it here (and many other places, in case this link goes bad): [A fast algorithm for finding dominators in a flowgraph](https://www.cs.princeton.edu/courses/archive/fall03/cs528/handouts/a%20fast%20algorithm%20for%20finding.pdf)

## Install

```sh
npm i dominators
```

## Usage

```js
const 
    { 
        iterative, 
        yalt, 
        frontiers_from_preds, 
        frontiers_from_succs,
        reverse_flow
    } = require( 'dominators' ),
    
    someGraph = [
                        [ 1, 8 ],    // start
                        [ 2, 3 ],    // a
                        [ 3 ],       // b
                        [ 4, 5 ],    // c
                        [ 6 ],       // d
                        [ 6 ],       // e
                        [ 7, 2 ],    // f
                        [ 8 ],       // g
                        []           // end
                    ],
    immediateDominators = iterative( someGraph ),
    //  idoms = [ null, 0, 1, 1, 3, 3, 3, 6, 0 ],

    df = frontiers_from_succs( someGraph, immediateDominators ),
    // df = [ [], [ 8 ], [ 3 ], [ 2, 8 ], [ 6 ], [ 6 ], [ 2, 8 ], [ 8 ], [] ]
    // or
    same = frontiers_from_preds( reverse_flow( someGraph ), immediateDominators ),
    // df = [ [], [ 8 ], [ 3 ], [ 2, 8 ], [ 6 ], [ 6 ], [ 2, 8 ], [ 8 ], [] ]

    ltDoms = yalt( someGraph ),
    //  ltDoms = [ null, 0, 1, 1, 3, 3, 3, 6, 0 ],
    
    // Your options for the last param is 'normal' (default), 'flat', and 'large'
    // Each one uses slightly different implementations of eval and link
    // You practically always want to leave it at the default 'normal'
    ltDomsSame = yalt( someGraph, 0, 'large' );
    //  ltDoms = [ null, 0, 1, 1, 3, 3, 3, 6, 0 ],


```

## License

MIT © [Julian Jensen](https://github.com/julianjensen/dominators)

<a id="chk" href="#chkref"><sup>1</sup></a> Cooper, Keith & Harvey, Timothy & Kennedy, Ken. (2006). A Simple, Fast Dominance Algorithm. Rice University, CS Technical Report 06-33870

<a id="lt" href="#ltref"><sup>2</sup></a> Thomas Lengauer and Robert Endre Tarjan. 1979. A fast algorithm for finding dominators in a flowgraph. ACM Trans. Program. Lang. Syst. 1, 1 (January 1979), 121-141. DOI=http://dx.doi.org/10.1145/357062.357071

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

