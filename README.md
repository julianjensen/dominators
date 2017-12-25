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

## Functions

<dl>
<dt><a href="#make_dom">make_dom(opts)</a> ⇒ <code>Object</code></dt>
<dd><p>This will associated a graph with a number of useful utility functions. It will return an
object with a variety of functions that operate on the graphs.</p>
<p>You might notice that many of these functions I took from the WebKit <code>dominators.h</code> file, which
I really liked, and, although I re-wrote the code completely (obviously, since it was in <code>C++</code>), I decided
to keep their comments with a few small alterations or corrections. I decided to not use their iterated dominance frontier
code, because it was as efficient as it could be. Instead, I implemented one that uses a DJ-graph
that I found in Chapter 4 of &quot;The SSA Book,&quot; called &quot;Advanced Contruction Algorithms for SSA&quot; by
<em>D. Das</em>, <em>U. Ramakrishna</em>, <em>V. Sreedhar</em>. That book doesn&#39;t seem to be published or, if it has, I&#39;ve
missed it. You can build the book yourself, supposedly, (I couldn&#39;t make that work, though) from here: <a href="https://gforge.inria.fr/scm/?group_id=1950">SSA Book</a>
or you can probably find a PDF version of it somewhere on the web, which is what I did.</p>
</dd>
<dt><a href="#iterative">iterative(succs, [startIndex], [flat])</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Implements a near-linear time iterative dominator generator based on this
paper: (A Simple, Fast Dominance Algorithm)[<a href="https://www.cs.rice.edu/~keith/Embed/dom.pdf">https://www.cs.rice.edu/~keith/Embed/dom.pdf</a>]
Citation:
Cooper, Keith &amp; Harvey, Timothy &amp; Kennedy, Ken. (2006). A Simple, Fast Dominance Algorithm. Rice University, CS Technical Report 06-33870</p>
</dd>
<dt><a href="#check">check(vertices, idoms)</a></dt>
<dd><p>Find dominance frontiers</p>
</dd>
<dt><a href="#frontiers_from_preds">frontiers_from_preds(preds, idoms)</a></dt>
<dd><p>Find dominance frontiers</p>
</dd>
<dt><a href="#frontiers_from_succs">frontiers_from_succs(succs, idoms)</a></dt>
<dd><p>Find dominance frontiers</p>
</dd>
<dt><a href="#lt">lt(nodes, [startIndex], [flat])</a></dt>
<dd></dd>
<dt><a href="#normalize">normalize(nodes)</a> ⇒ <code>Array.&lt;Array.&lt;number&gt;&gt;</code></dt>
<dd></dd>
<dt><a href="#condRefToSelf">condRefToSelf(seed, [chk], [dest])</a> ⇒ <code>Array.&lt;Array.&lt;number&gt;&gt;</code></dt>
<dd></dd>
<dt><a href="#simpleRefToSelf">simpleRefToSelf(seed, [dest])</a> ⇒ <code>Array.&lt;Array.&lt;number&gt;&gt;</code></dt>
<dd></dd>
<dt><a href="#create_j_edges">create_j_edges(_nodes, [domLevels], [domTree], [idoms])</a> ⇒ <code>*</code></dt>
<dd><p>This will create and return the J-edges of a graph. The J-edges, or Join edges,
make up one-half of the DJ-graph. For more information read the documentation
for the DJ-graph.</p>
<p>You need only pass the nodes of the graph to this function. The rest of the parameters
are optional and will be computed if not provided. I allow the options to pass them
in case you already have them calculated from elsewhere, just to make things a bit faster.
If no arguments are provided other than the basic vertices, it will compute the immediate
dominators, create the dominator tree, and compute the levels, and discard all of those results.
Not a big deal unless you&#39;re dealing with very large graphs, in which case you should
calculate those separately and provide them as inputs here.</p>
</dd>
<dt><a href="#create_levels">create_levels(nodes)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Calculate the level of each node in terms of how many edges it takes to reach
the root. For the sake of simplicity, this uses a BFS to compute depth values.</p>
</dd>
<dt><a href="#create_nodes">create_nodes(_nodes, [idoms])</a></dt>
<dd><p>A convenience method. It returns an array of object, one for each nodes in the graph,
and in that order, that holds most of the information you could want for working
with graphs.</p>
<p>Specifically, each node looks as descibed in the typedef for GraphNode.</p>
</dd>
<dt><a href="#create_dj_graph">create_dj_graph(nodes, [idoms], [domTree])</a></dt>
<dd><p>Returns a DJ-graph which is a graph that consts of the dominator tree and select
join edges from the input graph.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#DomWalkerOptions">DomWalkerOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#GraphNode">GraphNode</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="make_dom"></a>

## make_dom(opts) ⇒ <code>Object</code>
This will associated a graph with a number of useful utility functions. It will return an
object with a variety of functions that operate on the graphs.

You might notice that many of these functions I took from the WebKit `dominators.h` file, which
I really liked, and, although I re-wrote the code completely (obviously, since it was in `C++`), I decided
to keep their comments with a few small alterations or corrections. I decided to not use their iterated dominance frontier
code, because it was as efficient as it could be. Instead, I implemented one that uses a DJ-graph
that I found in Chapter 4 of "The SSA Book," called "Advanced Contruction Algorithms for SSA" by
_D. Das_, _U. Ramakrishna_, _V. Sreedhar_. That book doesn't seem to be published or, if it has, I've
missed it. You can build the book yourself, supposedly, (I couldn't make that work, though) from here: [SSA Book](https://gforge.inria.fr/scm/?group_id=1950)
or you can probably find a PDF version of it somewhere on the web, which is what I did.

**Kind**: global function  

| Param | Type |
| --- | --- |
| opts | [<code>DomWalkerOptions</code>](#DomWalkerOptions) \| <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 

**Example**  
```js
const myGraph = make_dom( graph );

myGraph.forStrictDominators( n => console.log( `${n} is a strict dominator of 9` ), 9 );
```
**Example**  
```js
if ( myGraph.strictlyDominates( 7, 9 ) )
    console.log( `7 strictly dominates 9` );
```
**Example**  
```js
console.log( `Node at index 7 strictly dominates these: ${myGraph.strictlyDominates( 7 ).join( ', ' )}` );
console.log( `The strict dominators of 7 are ${myGraph.strictDominators( 7 ).join( ', ' )}` );
```

* [make_dom(opts)](#make_dom) ⇒ <code>Object</code>
    * [~alternative_idf(defs)](#make_dom..alternative_idf) ⇒ <code>Array</code>
    * [~forIteratedDominanceFrontier(fn, defs)](#make_dom..forIteratedDominanceFrontier)
    * [~iteratedDominanceFrontier(defs)](#make_dom..iteratedDominanceFrontier) ⇒ <code>Array.&lt;number&gt;</code>
    * [~forStrictDominators(fn, to)](#make_dom..forStrictDominators)
    * [~forDominators(fn, to)](#make_dom..forDominators)
    * [~strictDominators(to)](#make_dom..strictDominators) ⇒ <code>Array.&lt;number&gt;</code>
    * [~dominators()](#make_dom..dominators) ⇒ <code>Array.&lt;number&gt;</code>
    * [~strictlyDominates(from, [to])](#make_dom..strictlyDominates) ⇒ <code>boolean</code> \| <code>Array.&lt;number&gt;</code>
    * [~dominates(from, [to])](#make_dom..dominates) ⇒ <code>boolean</code> \| <code>Array.&lt;number&gt;</code>
    * [~forStrictlyDominates(fn, from, [notStrict])](#make_dom..forStrictlyDominates)
    * [~forDominates(fn, from)](#make_dom..forDominates)
    * [~forDominanceFrontier(fn, from)](#make_dom..forDominanceFrontier)
    * [~dominanceFrontier(from)](#make_dom..dominanceFrontier) ⇒ <code>Array.&lt;number&gt;</code>
    * [~forPrunedIteratedDominanceFrontier(fn, from)](#make_dom..forPrunedIteratedDominanceFrontier)

<a name="make_dom..alternative_idf"></a>

### make_dom~alternative_idf(defs) ⇒ <code>Array</code>
This calculates the iterated dominance frontier quickest of all but requires
that you have already computed the dominance frontier for each individual node.
If you call this without frontiers being set, it will calculate all of them the
first time.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| defs | <code>Array.&lt;number&gt;</code> | 

<a name="make_dom..forIteratedDominanceFrontier"></a>

### make_dom~forIteratedDominanceFrontier(fn, defs)
Same as `iteratedDominanceFrontier( defs )` except it doesn't return anything but will
invoke the callback as it discovers each node in the iterated dominance frontier.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | A callback function with one argument, a node in the DF of the input list |
| defs | <code>Array.&lt;number&gt;</code> | A list of definition nodes |

<a name="make_dom..iteratedDominanceFrontier"></a>

### make_dom~iteratedDominanceFrontier(defs) ⇒ <code>Array.&lt;number&gt;</code>
Given a list of definition nodes, let's call them start nodes, this will return the
dominance frontier of those nodes. If you're doing SSA, this would be where you'd
want to place phi-functions when building a normal SSA tree. To create a pruned or
minimal tree, you'd probably have to discard some of these but it makes for a starting point.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  
**Returns**: <code>Array.&lt;number&gt;</code> - - A list of all node sin the DF of the input set  

| Param | Type | Description |
| --- | --- | --- |
| defs | <code>Array.&lt;number&gt;</code> | A list of definition nodes |

<a name="make_dom..forStrictDominators"></a>

### make_dom~forStrictDominators(fn, to)
Loops through each strict dominator of the given node.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 
| to | <code>number</code> | 

<a name="make_dom..forDominators"></a>

### make_dom~forDominators(fn, to)
This will visit the dominators starting with the `to` node and moving up the idom tree
until it gets to the root.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 
| to | <code>number</code> | 

<a name="make_dom..strictDominators"></a>

### make_dom~strictDominators(to) ⇒ <code>Array.&lt;number&gt;</code>
This will return all strict dominators for the given node. Same as `dominators` but
excluding the given node.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| to | <code>number</code> | 

<a name="make_dom..dominators"></a>

### make_dom~dominators() ⇒ <code>Array.&lt;number&gt;</code>
This returns a list of all dominators for the given node, including the node itself since a node
always dominates itself.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  
<a name="make_dom..strictlyDominates"></a>

### make_dom~strictlyDominates(from, [to]) ⇒ <code>boolean</code> \| <code>Array.&lt;number&gt;</code>
This will return one of two things. If call with two node numbers, it will return a `boolean` indicating
if the first node strictly dominates the second node.

If called with only one node number then it will create a list of all nodes strictly dominated by the given
node.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| from | <code>number</code> | 
| [to] | <code>number</code> | 

<a name="make_dom..dominates"></a>

### make_dom~dominates(from, [to]) ⇒ <code>boolean</code> \| <code>Array.&lt;number&gt;</code>
This is the same as the `strictlyDominates()` function but includes the given node.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| from | <code>number</code> | 
| [to] | <code>number</code> | 

<a name="make_dom..forStrictlyDominates"></a>

### make_dom~forStrictlyDominates(fn, from, [notStrict])
Thie loops through all nodes strictly dominated by the given node.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type | Default |
| --- | --- | --- |
| fn | <code>function</code> |  | 
| from | <code>number</code> |  | 
| [notStrict] | <code>boolean</code> | <code>false</code> | 

<a name="make_dom..forDominates"></a>

### make_dom~forDominates(fn, from)
Thie loops through all nodes strictly dominated by the given node, including the node itself.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 
| from | <code>number</code> | 

<a name="make_dom..forDominanceFrontier"></a>

### make_dom~forDominanceFrontier(fn, from)
Paraphrasing from [Dominator (graph theory)](https://en.wikipedia.org/wiki/Dominator_(graph_theory)):

>    "The dominance frontier of a block 'from' is the set of all blocks 'to' such that
>    'from' dominates an immediate predecessor of 'to', but 'from' does not strictly
>    dominate 'to'."

A useful corner case to remember: a block may be in its own dominance frontier if it has
a loop edge to itself, since it dominates itself and so it dominates its own immediate
predecessor, and a block never strictly dominates itself.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 
| from | <code>number</code> | 

<a name="make_dom..dominanceFrontier"></a>

### make_dom~dominanceFrontier(from) ⇒ <code>Array.&lt;number&gt;</code>
Returns the dominanace frontier of a given node.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| from | <code>number</code> | 

<a name="make_dom..forPrunedIteratedDominanceFrontier"></a>

### make_dom~forPrunedIteratedDominanceFrontier(fn, from)
This is a close relative of forIteratedDominanceFrontier(), which allows the
given predicate function to return false to indicate that we don't wish to consider the given block.
Useful for computing pruned SSA form.

**Kind**: inner method of [<code>make_dom</code>](#make_dom)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 
| from | <code>Array.&lt;number&gt;</code> | 

<a name="iterative"></a>

## iterative(succs, [startIndex], [flat]) ⇒ <code>Array.&lt;number&gt;</code>
Implements a near-linear time iterative dominator generator based on this
paper: (A Simple, Fast Dominance Algorithm)[https://www.cs.rice.edu/~keith/Embed/dom.pdf]
Citation:
Cooper, Keith & Harvey, Timothy & Kennedy, Ken. (2006). A Simple, Fast Dominance Algorithm. Rice University, CS Technical Report 06-33870

**Kind**: global function  

| Param | Type | Default |
| --- | --- | --- |
| succs | <code>Array.&lt;(Array.&lt;number&gt;\|number)&gt;</code> |  | 
| [startIndex] | <code>number</code> | <code>0</code> | 
| [flat] | <code>boolean</code> | <code>true</code> | 

<a name="iterative..nsuccs"></a>

### iterative~nsuccs : <code>Array.&lt;Array.&lt;number&gt;&gt;</code>
**Kind**: inner constant of [<code>iterative</code>](#iterative)  
<a name="check"></a>

## check(vertices, idoms)
Find dominance frontiers

**Kind**: global function  

| Param | Type |
| --- | --- |
| vertices | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| idoms | <code>Array.&lt;?number&gt;</code> | 

<a name="frontiers_from_preds"></a>

## frontiers_from_preds(preds, idoms)
Find dominance frontiers

**Kind**: global function  

| Param | Type |
| --- | --- |
| preds | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| idoms | <code>Array.&lt;?number&gt;</code> | 

<a name="frontiers_from_succs"></a>

## frontiers_from_succs(succs, idoms)
Find dominance frontiers

**Kind**: global function  

| Param | Type |
| --- | --- |
| succs | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| idoms | <code>Array.&lt;?number&gt;</code> | 

<a name="lt"></a>

## lt(nodes, [startIndex], [flat])
**Kind**: global function  

| Param | Type | Default |
| --- | --- | --- |
| nodes | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> |  | 
| [startIndex] | <code>number</code> | <code>0</code> | 
| [flat] | <code>boolean</code> | <code>true</code> | 

<a name="normalize"></a>

## normalize(nodes) ⇒ <code>Array.&lt;Array.&lt;number&gt;&gt;</code>
**Kind**: global function  

| Param | Type |
| --- | --- |
| nodes | <code>Array.&lt;(Array.&lt;number&gt;\|number)&gt;</code> | 

<a name="condRefToSelf"></a>

## condRefToSelf(seed, [chk], [dest]) ⇒ <code>Array.&lt;Array.&lt;number&gt;&gt;</code>
**Kind**: global function  
**Returns**: <code>Array.&lt;Array.&lt;number&gt;&gt;</code> - }  

| Param | Type |
| --- | --- |
| seed | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| [chk] | <code>function</code> | 
| [dest] | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 

<a name="simpleRefToSelf"></a>

## simpleRefToSelf(seed, [dest]) ⇒ <code>Array.&lt;Array.&lt;number&gt;&gt;</code>
**Kind**: global function  
**Returns**: <code>Array.&lt;Array.&lt;number&gt;&gt;</code> - }  

| Param | Type |
| --- | --- |
| seed | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| [dest] | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 

<a name="create_j_edges"></a>

## create_j_edges(_nodes, [domLevels], [domTree], [idoms]) ⇒ <code>\*</code>
This will create and return the J-edges of a graph. The J-edges, or Join edges,
make up one-half of the DJ-graph. For more information read the documentation
for the DJ-graph.

You need only pass the nodes of the graph to this function. The rest of the parameters
are optional and will be computed if not provided. I allow the options to pass them
in case you already have them calculated from elsewhere, just to make things a bit faster.
If no arguments are provided other than the basic vertices, it will compute the immediate
dominators, create the dominator tree, and compute the levels, and discard all of those results.
Not a big deal unless you're dealing with very large graphs, in which case you should
calculate those separately and provide them as inputs here.

**Kind**: global function  
**See**: create_dj_graph  

| Param | Type | Description |
| --- | --- | --- |
| _nodes | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | An array of arrays of successors indices, as always |
| [domLevels] | <code>Array.&lt;number&gt;</code> | The levels (or depth) of the nodes in the dominator tree |
| [domTree] | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | The dominator tree in the standard format, same as _nodes |
| [idoms] | <code>Array.&lt;number&gt;</code> | The immediate dominators |

<a name="create_levels"></a>

## create_levels(nodes) ⇒ <code>Array.&lt;number&gt;</code>
Calculate the level of each node in terms of how many edges it takes to reach
the root. For the sake of simplicity, this uses a BFS to compute depth values.

**Kind**: global function  
**Returns**: <code>Array.&lt;number&gt;</code> - - An array of depth (i.e. level) numbers  

| Param | Type | Description |
| --- | --- | --- |
| nodes | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | The graph |

<a name="create_nodes"></a>

## create_nodes(_nodes, [idoms])
A convenience method. It returns an array of object, one for each nodes in the graph,
and in that order, that holds most of the information you could want for working
with graphs.

Specifically, each node looks as descibed in the typedef for GraphNode.

**Kind**: global function  
**See**: GraphNode  

| Param | Type | Description |
| --- | --- | --- |
| _nodes | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | The usual graph nodes |
| [idoms] | <code>Array.&lt;number&gt;</code> | The immediate dominators, if not provided, they will be computed |

<a name="create_dj_graph"></a>

## create_dj_graph(nodes, [idoms], [domTree])
Returns a DJ-graph which is a graph that consts of the dominator tree and select
join edges from the input graph.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| nodes | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | Graph in the usual format |
| [idoms] | <code>Array.&lt;number&gt;</code> | Immediate dominators, if omiteed, they will be computed |
| [domTree] | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | Dominator tree, it omitted, will be computed |

<a name="DomWalkerOptions"></a>

## DomWalkerOptions : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| nodes | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| idoms | <code>Array.&lt;?number&gt;</code> | 
| domTree | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| jEdges | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| frontiers | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> | 
| djGraph | <code>Array.&lt;Array.&lt;Array.&lt;number&gt;&gt;&gt;</code> | 
| domLevels | <code>Array.&lt;number&gt;</code> | 

<a name="GraphNode"></a>

## GraphNode : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The index of this node in the original array |
| succs | <code>Array.&lt;number&gt;</code> | The successor node indices |
| preds | <code>Array.&lt;number&gt;</code> | The predecessor node indices |
| domSuccs | <code>Array.&lt;number&gt;</code> | The dominator tree successor indices |
| idom | <code>number</code> | The immediate dominator and, of course, dominator tree predecessor |
| level | <code>number</code> | The depth (or level) of the vertex |
| domLevel | <code>number</code> | The depth in the dominator tree |
| jSuccs | <code>Array.&lt;number&gt;</code> | The successor J-edges, if any, of this node |
| jPreds | <code>Array.&lt;number&gt;</code> | The predecessor J-edges, if any, of this node |

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

