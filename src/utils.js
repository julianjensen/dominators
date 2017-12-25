/** ******************************************************************************************************************
 * @file Utilities for graph manipulation.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @date 14-Dec-2017
 *********************************************************************************************************************/
"use strict";

let _iterative;

const
    /**
     * @param {Array<Array<number>|number>} nodes
     * @return {Array<Array<number>>}
     */
    normalize = nodes => nodes.map( targets => Array.isArray( targets ) ? targets : typeof targets === 'number' ? [ targets ] : [] ),
    iterative = nodes => ( _iterative || ( _iterative = require( './fast-iterative' ) ) )( nodes ),

    arrayOfArrays = list => list.map( () => [] ),
    notNull       = chk => chk !== null,
    twoOrMore     = chk => chk.length > 1,

    /**
     * @param {Array<Array<number>>} seed
     * @param {function(number):boolean} [chk]
     * @param {Array<Array<number>>} [dest]
     * @return {Array<Array<number>>}}
     */
    condRefToSelf   = ( seed, chk = twoOrMore, dest = arrayOfArrays( seed ) ) => (
        seed.forEach( ( refIndex, selfIndex ) =>
            chk( refIndex ) &&
            (
                Array.isArray( refIndex )
                    ? refIndex.forEach( ref => dest[ ref ].push( selfIndex ) )
                    : dest[ refIndex ].push( selfIndex )
            )
        ), dest
    ),

    /**
     * @param {Array<Array<number>>} seed
     * @param {Array<Array<number>>} [dest]
     * @return {Array<Array<number>>}}
     */
    simpleRefToSelf = ( seed, dest = arrayOfArrays( seed ) ) => (
        seed.forEach( ( refIndex, selfIndex ) =>

            Array.isArray( refIndex )
                ? refIndex.forEach( ref => dest[ ref ].push( selfIndex ) )
                : dest[ refIndex ].push( selfIndex )
        ), dest
    );

/**
 * This will create and return the J-edges of a graph. The J-edges, or Join edges,
 * make up one-half of the DJ-graph. For more information read the documentation
 * for the DJ-graph.
 *
 * You need only pass the nodes of the graph to this function. The rest of the parameters
 * are optional and will be computed if not provided. I allow the options to pass them
 * in case you already have them calculated from elsewhere, just to make things a bit faster.
 * If no arguments are provided other than the basic vertices, it will compute the immediate
 * dominators, create the dominator tree, and compute the levels, and discard all of those results.
 * Not a big deal unless you're dealing with very large graphs, in which case you should
 * calculate those separately and provide them as inputs here.
 *
 * @see create_dj_graph
 *
 * @param {Array<Array<number>>} _nodes     - An array of arrays of successors indices, as always
 * @param {Array<number>} [domLevels]       - The levels (or depth) of the nodes in the dominator tree
 * @param {Array<Array<number>>} [domTree]  - The dominator tree in the standard format, same as _nodes
 * @param {Array<number>} [idoms]           - The immediate dominators
 * @return {*}
 */
function create_j_edges( _nodes, domLevels, domTree, idoms )
{
    const
        nodes = normalize( _nodes ),
        preds = simpleRefToSelf( nodes ),
        jTree = arrayOfArrays( preds );

    if ( !domLevels && !domTree && !idoms )
        idoms = iterative( nodes );

    if ( !domLevels && !domTree )
        domTree = condRefToSelf( idoms, notNull )

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

/**
 * Calculate the level of each node in terms of how many edges it takes to reach
 * the root. For the sake of simplicity, this uses a BFS to compute depth values.
 *
 * @param {Array<Array<number>>} nodes    - The graph
 * @return {Array<number>}                 - An array of depth (i.e. level) numbers
 */
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

/**
 * A convenience method. It returns an array of object, one for each nodes in the graph,
 * and in that order, that holds most of the information you could want for working
 * with graphs.
 *
 * Specifically, each node looks as descibed in the typedef for GraphNode.
 *
 * @see GraphNode
 *
 * @param {Array<Array<number>>} _nodes     - The usual graph nodes
 * @param {Array<number>} [idoms]           - The immediate dominators, if not provided, they will be computed
 */
function create_nodes( _nodes, idoms )
{
    const
        succs = normalize( _nodes ),
        preds = simpleRefToSelf( succs );

    if ( !idoms ) idoms = iterative( succs );

    const
        domTree   = condRefToSelf( idoms, notNull ),
        domPreds  = simpleRefToSelf( domTree ),
        levels    = create_levels( succs ),
        domLevels = create_levels( domTree ),
        jSuccs    = create_j_edges( succs ),

        nodes     = _nodes.map( ( n, i ) => ( {
            id:       i,
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

/**
 * Returns a DJ-graph which is a graph that consts of the dominator tree and select
 * join edges from the input graph.
 *
 * @param {Array<Array<number>>} nodes        - Graph in the usual format
 * @param {Array<number>} [idoms]        - Immediate dominators, if omiteed, they will be computed
 * @param {Array<Array<number>>} [domTree]    - Dominator tree, it omitted, will be computed
 */
function create_dj_graph( nodes, idoms, domTree )
{

    if ( !idoms && !domTree )
        idoms = iterative( nodes );

    if ( !domTree )
        domTree = condRefToSelf( idoms, notNull );

    const jt = create_j_edges( nodes );

    return nodes.map( ( _, i ) => [ domTree[ i ], jt[ i ] ] );
}


module.exports = {
    arrayOfArrays,
    simpleRefToSelf,
    reverse_graph( succs ) {
        if ( !Array.isArray( succs ) )
            throw new TypeError( `The list of successor lists must be an array` );

        return simpleRefToSelf( module.exports.normalize( succs ) );
    },
    succs_to_preds: simpleRefToSelf,
    preds_to_succs: simpleRefToSelf,

    create_dom_tree: nodes => condRefToSelf( nodes, notNull ),
    create_dj_graph,
    create_nodes,
    create_levels,
    create_j_edges,

    normalize
};

