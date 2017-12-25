/** ******************************************************************************************************************
 * @file Describe what dom-tree does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 23-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { isArray: array }       = Array,
    {
        normalize,
        create_dom_tree,
        succs_to_preds,
        arrayOfArrays
    }                        = require( './utils' ),

    iterative                = require( './fast-iterative' ),
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

function create_j_edges( _nodes, domLevels, domTree, idoms )
{
    const
        nodes = normalize( _nodes ),
        preds = succs_to_preds( nodes ),
        jTree = arrayOfArrays( preds );

    if ( !domLevels && !domTree && !idoms )
        idoms = iterative( nodes );

    if ( !domLevels && !domTree )
        domTree = create_dom_tree( idoms );

    if ( !domLevels )
        domLevels = create_levels( domTree );

    for ( let index = 0, lng = nodes.length; index < lng; ++index )
    {
        if ( preds[ index ].length < 2 ) continue;

        const lvl = domLevels[ index ];

        for ( const p of preds[ index ] )
        {
            if ( domLevels[ p ] >= lvl )
                jTree[ p ].push( index );
        }
    }

    return jTree;
}

function create_levels( nodes )
{
    let worklist = [ 0 ],
        visited  = [ true ],
        levels   = [ 0 ],
        max      = -Infinity;

    while ( worklist.length )
    {
        let item  = worklist.shift(),
            succs = nodes[ item ];

        for ( let i = 0, lng = succs.length; i < lng; ++i )
        {
            const n = succs[ i ];
            if ( visited[ n ] ) continue;
            visited[ n ] = true;
            levels[ n ] = levels[ item ] + 1;
            if ( levels[ n ] > max ) max = levels[ n ];
            worklist.push( n );
        }
    }

    Object.defineProperty( levels, 'max', { value: max, enumerable: false } );
    return levels;
}

function create_nodes( _nodes, idoms )
{
    const
        succs     = normalize( _nodes ),
        preds     = succs_to_preds( succs );

    if ( !idoms ) idoms = iterative( succs );

    const
        domTree   = create_dom_tree( idoms ),
        domPreds  = succs_to_preds( domTree ),
        levels    = create_levels( succs ),
        domLevels = create_levels( domTree ),
        jSuccs    = create_j_edges( succs ),

        nodes     = _nodes.map( ( n, i ) => ( {
            succs:    succs[ i ],
            preds:    preds[ i ],
            domSuccs: domTree[ i ],
            idom:     domPreds[ i ][ 0 ],
            level:    levels[ i ],
            domLevel: domLevels[ i ],
            jSuccs:   jSuccs[ i ],
            jPreds:   []
        } ) );

    nodes.forEach( ( { jSuccs }, i ) => jSuccs.forEach( s => nodes[ s ].jPreds.push( i ) ) );

    return nodes;
}

function create_dj_graph( nodes, idoms, domTree )
{

    if ( !idoms && !domTree )
        idoms = iterative( nodes );

    if ( !domTree )
        domTree = create_dom_tree( idoms );

    const jt = create_j_edges( nodes );

    return nodes.map( ( _, i ) => [ domTree[ i ], jt[ i ] ] );
}

/**
 * @typedef {object} DomWalkerOptions
 * @property {Array<Array<number>>} nodes
 * @property {Array<?number>} [idoms]
 * @property {Array<Array<number>>} [domTree]
 * @property {Array<Array<number>>} [jEdges]
 * @property {Array<Array<number>>} [frontiers]
 * @property {Array<Array<number>, Array<number>>} [djGraph]
 * @property {Array<number>} [domLevels]
 */

/**
 * @param {DomWalkerOptions|Array<Array<number>>} opts
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

    /**
     * @param {function|Array<number>} fn
     * @param {Array<number>|function} [defs]
     * @return {*[]}
     */
    function iterated_dominance_frontier( fn, defs )
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
            defSet     = new Set( defs ),
            dfPlus     = new Set(),
            visited    = [],
            byLevel    = [],
            maxLevel   = maxDomLevel - 1,
            insertNode = x => byLevel[ domLevels[ x ] ].push( x );

        let i = 0, currentRoot, z;

        while ( i < maxDomLevel ) byLevel[ i++ ] = [];

        defs.forEach( insertNode );

        while ( ( z = get_deepest_node() ) !== null )
            visit( currentRoot = z );

        function visit( x )
        {
            visited[ x ] = true;

            const iter = succs( djGraph[ x ] );

            for ( const { j, d } of iter )
            {
                if ( j !== null && domLevels[ j ] <= domLevels[ currentRoot ] && !dfPlus.has( j ) )
                {
                    if ( fn ) fn( j );
                    dfPlus.add( j );
                    if ( !defSet.has( j ) ) // if ( !defs.includes( j ) )
                        insertNode( j );
                }
                else if ( d !== null && !visited[ d ] )
                    visit( d );
            }
        }

        function *succs( [ dEdges, jEdges ] )
        {
            for ( const j of jEdges )
                yield { j, d: null };

            for ( const d of dEdges )
                yield { j: null, d };
        }

        function get_deepest_node()
        {
            let max = maxLevel;

            while ( max >= 0 && byLevel[ max ].length === 0 ) --max;

            return max >= 0 ? byLevel[ max ].pop() : null;
        }

        return [ ...dfPlus ];
    }

    /** ****************************************************************************************************************************
     *
     * DOMINATORS UP
     *
     *******************************************************************************************************************************/

    /**
     * @param {function(number)} fn
     * @param {number} dom
     */
    function forStrictDominators( fn, dom )
    {
        walkUp( fn, idoms[ dom ] );
    }

    /**
     * Note: This will visit the dominators starting with the 'to' node and moving up the idom tree
     * until it gets to the root.
     *
     * @param {function(number)} fn
     * @param {number} dom
     */
    function forDominators( fn, dom )
    {
        walkUp( fn, dom );
    }

    /**
     * @param {number} dom
     * @return {Array<number>}
     */
    function strictDominators( dom )
    {
        const r = [];

        walkUp( b => r.push( b ), idoms[ dom ] );

        return r;
    }

    /**
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
     * @param {number} from
     * @return {Array<number>}
     */
    function dominanceFrontier( from )
    {
        const result = new Set();

        forDominanceFrontier( node => result.add( node ), from );
        return [ ...result ];
    }

    /**
     * @param {function} fn
     * @param {Array<number>} from
     */
    function forIteratedDominanceFrontier( fn, from )
    {
        const caller = block => {
            fn( block );
            return true;
        };

        forPrunedIteratedDominanceFrontier( caller, from );
    }

    /**
     * This is a close relative of forIteratedDominanceFrontier(), which allows the
     * given functor to return false to indicate that we don't wish to consider the given block.
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

    /**
     * @param {Array<number>} from
     * @return {Array<number>}
     */
    function iteratedDominanceFrontier( from )
    {
        const
            _result = new Set(),
            result  = adder( _result );

        _forIteratedDominanceFrontier( result, from );

        return [ ..._result ];
    }

    /**
     * Paraphrasing from http:*en.wikipedia.org/wiki/Dominator_(graph_theory):
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
        const worklist = from.slice();

        while ( worklist.length )
        {
            _forDominanceFrontier( otherBlock => fn( otherBlock ) && worklist.push( otherBlock ), worklist.pop() );
        }
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
        forIteratedDominanceFrontier,
        forPrunedIteratedDominanceFrontier,

        iterated_dominance_frontier,
        iteratedDominanceFrontier
    };
}


module.exports = {
    create_j_edges,
    create_nodes,
    create_dj_graph,
    make_dom,
    create_levels
};
