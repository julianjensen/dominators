/** ******************************************************************************************************************
 * @file Utilities for working with dominators and their frontiers.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 23-Dec-2017
 *********************************************************************************************************************/
"use strict";

/**
 * @typedef {object} DomWalkerOptions
 * @property {Array<Array<number>>} nodes
 * @property {Array<?number>} [idoms]
 * @property {Array<Array<number>>} [domTree]
 * @property {Array<Array<number>>} [jEdges]
 * @property {Array<Array<number>>} [frontiers]
 * @property {Array<Array<Array<number>>>} [djGraph]
 * @property {Array<number>} [domLevels]
 */

/**
 * @typedef {object} GraphNode
 * @property {number} id            - The index of this node in the original array
 * @property {Array<number>} succs       - The successor node indices
 * @property {Array<number>} preds       - The predecessor node indices
 * @property {Array<number>} domSuccs    - The dominator tree successor indices
 * @property {number} idom          - The immediate dominator and, of course, dominator tree predecessor
 * @property {number} level         - The depth (or level) of the vertex
 * @property {number} domLevel      - The depth in the dominator tree
 * @property {Array<number>} jSuccs      - The successor J-edges, if any, of this node
 * @property {Array<number>} jPreds      - The predecessor J-edges, if any, of this node
 */


const
    { isArray: array }       = Array,
    {
        normalize,
        create_dj_graph,
        create_levels,
        simpleRefToSelf
    }                        = require( './utils' ),

    iterative                = require( './fast-iterative' ),
    { frontiers_from_preds } = require( './frontiers' ),
    simple_dfs = tree => {
        const pre = [], post = [];

        let preN = 0, postN = 0, worklist = [ 0 ];

        while ( worklist.length )
        {
            let item = worklist.pop();

            if ( item >= 0 )
            {
                pre[ item ] = preN++;
                worklist.push( -item - 1 );
                for ( let i = tree[ item ].length - 1; i >= 0; --i )
                    worklist.push( tree[ item ][ i ] );
            }
            else
                post[ -item - 1 ] = postN++;
        }
        return [ pre, post ];
    };

/**
 * This will associated a graph with a number of useful utility functions. It will return an
 * object with a variety of functions that operate on the graphs.
 *
 * You might notice that many of these functions I took from the WebKit `dominators.h` file, which
 * I really liked, and, although I re-wrote the code completely (obviously, since it was in `C++`), I decided
 * to keep their comments with a few small alterations or corrections. I decided to not use their iterated dominance frontier
 * code, because it was as efficient as it could be. Instead, I implemented one that uses a DJ-graph
 * that I found in Chapter 4 of "The SSA Book," called "Advanced Contruction Algorithms for SSA" by
 * _D. Das_, _U. Ramakrishna_, _V. Sreedhar_. That book doesn't seem to be published or, if it has, I've
 * missed it. You can build the book yourself, supposedly, (I couldn't make that work, though) from here: [SSA Book](https://gforge.inria.fr/scm/?group_id=1950)
 * or you can probably find a PDF version of it somewhere on the web, which is what I did.
 *
 * @example
 * const myGraph = make_dom( graph );
 *
 * myGraph.forStrictDominators( n => console.log( `${n} is a strict dominator of 9` ), 9 );
 *
 * @example
 * if ( myGraph.strictlyDominates( 7, 9 ) )
 *     console.log( `7 strictly dominates 9` );
 *
 * @example
 * console.log( `Node at index 7 strictly dominates these: ${myGraph.strictlyDominates( 7 ).join( ', ' )}` );
 * console.log( `The strict dominators of 7 are ${myGraph.strictDominators( 7 ).join( ', ' )}` );
 *
 * @param {DomWalkerOptions|Array<Array<number>>} opts
 * @return {{forStrictDominators: forStrictDominators, forDominators: forDominators, strictDominators: strictDominators, dominators: dominators, forStrictlyDominates: forStrictlyDominates, forDominates: forDominates, strictlyDominates: strictlyDominates, dominates: dominates, forDominanceFrontier: forDominanceFrontier, dominanceFrontier: dominanceFrontier, forIteratedDominanceFrontier: forIteratedDominanceFrontier, forPrunedIteratedDominanceFrontier: forPrunedIteratedDominanceFrontier, iterated_dominance_frontier: iterated_dominance_frontier, iteratedDominanceFrontier: iteratedDominanceFrontier}}
 */
function make_dom( opts )
{
    if ( array( opts ) )
        opts = { nodes: opts };

    if ( !array( opts.nodes ) )
        throw new Error( "You have to pass at least an array of nodes to make a Dominator walker object" );

    let { nodes, idoms, djGraph } = opts;

    nodes = normalize( nodes );

    if ( !idoms ) idoms = iterative( nodes );

    let doms2nodes = [];

    idoms.forEach( ( dom, i ) => dom !== null && ( doms2nodes[ dom ] = i ) );

    if ( !djGraph ) djGraph = create_dj_graph( nodes, idoms );

    let domTree = djGraph.map( n => n[ 0 ] );

    let domLevels   = create_levels( domTree ),
        maxDomLevel = domLevels.max;

    const
        walkUp = ( fn, index ) => {
            while ( index )
            {
                fn( index );
                index = idoms[ index ];
            }
        },
        adder  = s => val => {
            if ( s.has( val ) ) return false;
            s.add( val );
            return true;
        },
        [ pre, post ] = simple_dfs( domTree );

    let frontiers = opts.frontiers;

    /**
     * This calculates the iterated dominance frontier quickest of all but requires
     * that you have already computed the dominance frontier for each individual node.
     * If you call this without frontiers being set, it will calculate all of them the
     * first time.
     *
     * @param {Array<number>} defs
     * @return {Array}
     */
    function alternative_idf( defs )
    {
        if ( !frontiers ) frontiers = frontiers_from_preds( simpleRefToSelf( nodes ), idoms );

        const
            _v = [],
            added = [],
            dfp = [],
            add = n => added.includes( n ) || added.push( dfp[ dfp.length ] = n ),
            worklist = defs.reduce( ( all, n ) => all.concat( frontiers[ n ] ), [] );

        while ( worklist.length )
        {
            const
                n = worklist.pop(),
                front = frontiers[ n ];

            _v[ n ] = true;
            add( n );

            for ( let i = 0, lng = front.length; i < lng; ++i )
            {
                const fi = front[ i ];
                if ( _v[ fi ] !== true )
                    worklist.push( fi );
            }
        }

        return dfp;
    }

    /**
     * Same as `iteratedDominanceFrontier( defs )` except it doesn't return anything but will
     * invoke the callback as it discovers each node in the iterated dominance frontier.
     *
     * @param {function(number):*} fn   - A callback function with one argument, a node in the DF of the input list
     * @param {Array<number>} defs      - A list of definition nodes
     */
    function forIteratedDominanceFrontier( fn, defs )
    {
        _iterated_dominance_frontier( fn, defs );
    }

    /**
     * Given a list of definition nodes, let's call them start nodes, this will return the
     * dominance frontier of those nodes. If you're doing SSA, this would be where you'd
     * want to place phi-functions when building a normal SSA tree. To create a pruned or
     * minimal tree, you'd probably have to discard some of these but it makes for a starting point.
     *
     * @param {Array<number>} defs      - A list of definition nodes
     * @return {Array<number>}          - A list of all node sin the DF of the input set
     */
    function iteratedDominanceFrontier( defs )
    {
        const dfplus = [];

        _iterated_dominance_frontier( n => dfplus.push( n ), defs );

        return dfplus;
    }

    /**
     * @param {function|Array<number>} fn
     * @param {Array<number>|function} [defs]
     * @return {Set<number>}
     * @private
     */
    function _iterated_dominance_frontier( fn, defs )
    {
        if ( array( fn ) )
        {
            if ( typeof defs === 'function' )
            {
                const tmp = defs;
                defs = fn;
                fn = tmp;
            }
            else
            {
                defs = fn;
                fn = null;
            }
        }

        const
            dfPlus     = new Set(),
            visited    = [],
            byLevel    = [],
            maxLevel   = maxDomLevel,
            insertNode = x => byLevel[ domLevels[ x ] ].push( x );

        let i = 0, currentRoot, z, lastMax = maxLevel;

        while ( i <= maxLevel ) byLevel[ i++ ] = [];

        defs.forEach( insertNode );

        while ( ( z = get_deepest_node() ) !== null )
            visit( currentRoot = z );

        /**
         * @param {number} x
         * @private
         */
        function visit( x )
        {
            visited[ x ] = true;

            const
                [ dEdges, jEdges ] = djGraph[ x ];

            for ( let i = 0, jlng = jEdges.length; i < jlng; ++i )
            {
                const
                    j = jEdges[ i ],
                    rootLevel = domLevels[ currentRoot ],
                    jlvl = domLevels[ j ];

                if ( jlvl <= rootLevel && !dfPlus.has( j ) )
                {
                    if ( fn ) fn( j );
                    dfPlus.add( j );
                    if ( !defs.includes( j ) )
                    {
                        if ( jlvl > lastMax ) lastMax = jlvl;
                        byLevel[ jlvl ].push( j );
                    }
                }
            }


            for ( let i = 0, dlng = dEdges.length; i < dlng; ++i )
            {
                const d = dEdges[ i ];
                if ( d !== null && visited[ d ] === void 0 ) visit( d );
            }
        }

        /**
         * @private
         * @return {?number}
         */
        function get_deepest_node()
        {
            let max = lastMax;

            while ( max >= 0 && byLevel[ max ].length === 0 ) --max;

            lastMax = max;
            return max >= 0 ? byLevel[ max ].pop() : null;
        }

        return dfPlus; // [ ...dfPlus ];
    }

    /** ****************************************************************************************************************************
     *
     * DOMINATORS UP
     *
     *******************************************************************************************************************************/

    /**
     * Loops through each strict dominator of the given node.
     *
     * @param {function(number)} fn
     * @param {number} to
     */
    function forStrictDominators( fn, to )
    {
        walkUp( fn, idoms[ to ] );
    }

    /**
     * This will visit the dominators starting with the `to` node and moving up the idom tree
     * until it gets to the root.
     *
     * @param {function(number)} fn
     * @param {number} to
     */
    function forDominators( fn, to )
    {
        walkUp( fn, to );
    }

    /**
     * This will return all strict dominators for the given node. Same as `dominators` but
     * excluding the given node.
     *
     * @param {number} to
     * @return {Array<number>}
     */
    function strictDominators( to )
    {
        const r = [];

        walkUp( b => r.push( b ), idoms[ to ] );

        return r;
    }

    /**
     * This returns a list of all dominators for the given node, including the node itself since a node
     * always dominates itself.
     *
     * @return {Array<number>}
     */
    function dominators( block )
    {
        const r = [];

        walkUp( b => r.push( b ), block );

        return r;
    }

    /** ****************************************************************************************************************************
     *
     * DOMINATES DOWN
     *
     *******************************************************************************************************************************/

    /**
     * This will return one of two things. If call with two node numbers, it will return a `boolean` indicating
     * if the first node strictly dominates the second node.
     *
     * If called with only one node number then it will create a list of all nodes strictly dominated by the given
     * node.
     *
     * @param {number} from
     * @param {number} [to]
     * @return {boolean|Array<number>}
     */
    function strictlyDominates( from, to )
    {
        if ( typeof to === 'number' ) return pre[ to ] > pre[ from ] && post[ to ] < post[ from ];

        const r = [];   // Was a Set()

        forStrictlyDominates( node => r.push( node ), from );

        return r;
    }

    /**
     * This is the same as the `strictlyDominates()` function but includes the given node.
     *
     * @param {number} from
     * @param {number} [to]
     * @return {boolean|Array<number>}
     */
    function dominates( from, to )
    {
        if ( typeof to === 'number' ) return from === to || pre[ to ] > pre[ from ] && post[ to ] < post[ from ];

        const r = [];   // Was a Set()

        forDominates( node => r.push( node ), from );

        return r;
    }

    /**
     * Thie loops through all nodes strictly dominated by the given node.
     *
     * @param {function} fn
     * @param {number} from
     * @param {boolean} [notStrict]=false]
     */
    function forStrictlyDominates( fn, from, notStrict = false )
    {
        let worklist = notStrict ? [ from ] : domTree[ from ].slice();

        while ( worklist.length )
        {
            const block = worklist.pop();
            fn( block );
            worklist = worklist.concat( domTree[ block ] );
        }
    }

    /**
     * Thie loops through all nodes strictly dominated by the given node, including the node itself.
     *
     * @param {function} fn
     * @param {number} from
     */
    function forDominates( fn, from )
    {
        forStrictlyDominates( fn, from, true );
    }

    /** ****************************************************************************************************************************
     *
     * DOMINANCE FRONTIER DOWN
     *
     *******************************************************************************************************************************/

    /**
     * Paraphrasing from [Dominator (graph theory)](https://en.wikipedia.org/wiki/Dominator_(graph_theory)):
     *
     * >    "The dominance frontier of a block 'from' is the set of all blocks 'to' such that
     * >    'from' dominates an immediate predecessor of 'to', but 'from' does not strictly
     * >    dominate 'to'."
     *
     * A useful corner case to remember: a block may be in its own dominance frontier if it has
     * a loop edge to itself, since it dominates itself and so it dominates its own immediate
     * predecessor, and a block never strictly dominates itself.
     *
     * @param {function} fn
     * @param {number} from
     */
    function forDominanceFrontier( fn, from )
    {
        const
            add = adder( new Set() );

        _forDominanceFrontier( block => add( block ) && fn( block ), from );
    }

    /**
     * Returns the dominanace frontier of a given node.
     *
     * @param {number} from
     * @return {Array<number>}
     */
    function dominanceFrontier( from )
    {
        if ( frontiers ) return frontiers[ from ];

        const result = new Set();

        forDominanceFrontier( node => result.add( node ), from );
        return [ ...result ];
    }

    // /**
    //  * @param {function} fn
    //  * @param {Array<number>} from
    //  */
    // function forIteratedDominanceFrontier( fn, from )
    // {
    //     const caller = block => {
    //         fn( block );
    //         return true;
    //     };
    //
    //     forPrunedIteratedDominanceFrontier( caller, from );
    // }

    /**
     * This is a close relative of forIteratedDominanceFrontier(), which allows the
     * given predicate function to return false to indicate that we don't wish to consider the given block.
     * Useful for computing pruned SSA form.
     *
     * @param {function} fn
     * @param {Array<number>} from
     */
    function forPrunedIteratedDominanceFrontier( fn, from )
    {
        const
            set = new Set(),
            add = adder( set );

        _forIteratedDominanceFrontier( block => add( block ) && fn( block ), from );
    }

    // /**
    //  * @param {Array<number>} from
    //  * @return {Array<number>}
    //  */
    // function iteratedDominanceFrontier( from )
    // {
    //     const
    //         _result = new Set(),
    //         result  = adder( _result );
    //
    //     _forIteratedDominanceFrontier( result, from );
    //
    //     return [ ..._result ];
    // }

    /**
     * @param {function} fn
     * @param {number} from
     * @private
     */
    function _forDominanceFrontier( fn, from )
    {
        forDominates( block => nodes[ block ].forEach( to => !strictlyDominates( from, to ) && fn( to ) ), from );
    }

    /**
     * @param {function} fn
     * @param {Array<number>} from
     * @private
     */
    function _forIteratedDominanceFrontier( fn, from )
    {
        const worklist = array( from ) ? from.slice() : [ from ];

        while ( worklist.length )
            _forDominanceFrontier( otherBlock => fn( otherBlock ) && worklist.push( otherBlock ), worklist.pop() );
    }

    return {
        forStrictDominators,
        forDominators,

        strictDominators,
        dominators,

        forStrictlyDominates,
        forDominates,

        strictlyDominates,
        dominates,

        forDominanceFrontier,
        dominanceFrontier,
        forPrunedIteratedDominanceFrontier,

        forIteratedDominanceFrontier,
        iteratedDominanceFrontier,

        alternative_idf
    };
}


module.exports = {
    make_dom,
    create_levels
};
