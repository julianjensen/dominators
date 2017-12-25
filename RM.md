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
        lt, 
        frontiers_from_preds, 
        frontiers_from_succs,
        reverse_graph
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
    same = frontiers_from_preds( reverse_graph( someGraph ), immediateDominators ),
    // df = [ [], [ 8 ], [ 3 ], [ 2, 8 ], [ 6 ], [ 6 ], [ 2, 8 ], [ 8 ], [] ]

    // See the explanation of parameters below.
    ltDoms = lt( someGraph, 0, true ),
    //  ltDoms = [ null, 0, 1, 1, 3, 3, 3, 6, 0 ],
    
    // The first parameter is your graph, an array of arrays of successor indices.
    // The second parameter is the start node, defaults to 0. This is optional and defaults to 0.
    // The last parameter is an optional boolean for whether to run it flat or not.
    // If it runs flat (set to true) then it will not use recursion for the DFS or the compress
    // function. The default is true.
    ltDomsSame = lt( someGraph, 0, true );
    //  ltDoms = [ null, 0, 1, 1, 3, 3, 3, 6, 0 ],

// Read full API documentation below
const myGraph = make_dom( graph );

myGraph.forStrictDominators( n => console.log( `${n} is a strict dominator of 9` ), 9 );

if ( myGraph.strictlyDominates( 7, 9 ) )
    console.log( `7 strictly dominates 9` );

console.log( `Node at index 7 strictly dominates these: ${myGraph.strictlyDominates( 7 ).join( ', ' )}` );
console.log( `The strict dominators of 7 are ${myGraph.strictDominators( 7 ).join( ', ' )}` );
```

### Fast Lengauer-Tarjan LINK procedure

For the sake of completeness, below is the fast balanaced version of link, which is not included in the current module code
for two reasons:

1. The LT algorithm with this LINK only becomes faster than the normal implementation when we're dealing with
   10s or 100s of thousands of nodes, in which cases you shouldn't be using JavaScript anyway.
2. I don't have test graph large enough to get proper coverage so, since it's not really useful,
   I decided to remove it.

This implementation uses arrays rather then an object. That's how I originally implemented this algorithm
but that makes it incompatible with the current implementation. I won't convert it since it's not used, however,
because it is interesting, I've included it here, for interested parties, of which there will probably be at least
zero but not more.

```js
    balanced_link = ( w ) => {
        let s = w,
            v = parent[ w ];

        do
        {
            let cs  = child[ s ],
                bcs = cs !== null ? best[ cs ] : null;

            if ( cs !== null && semi[ best[ w ] ] < semi[ bcs ] )
            {
                let ccs  = child[ cs ],
                    ss   = size[ s ],
                    scs  = size[ cs ],
                    sccs = ccs !== null ? size[ ccs ] : 0;

                if ( ss - scs >= scs - sccs )
                    child[ s ] = ccs;
                else
                {
                    size[ cs ] = ss;
                    ancestor[ s ] = cs;
                    s = cs;
                }
            }
            else
                break;
        }
        while ( true );

        best[ s ] = best[ w ];
        if ( size[ v ] < size[ w ] )
        {
            let t = s;
            s = child[ v ];
            child[ v ] = t;
        }
        size[ v ] += size[ w ];
        while ( s !== null )
        {
            ancestor[ s ] = v;
            s = child[ s ];
        }
    }
```

## License

MIT © [Julian Jensen](https://github.com/julianjensen/dominators)

## API

