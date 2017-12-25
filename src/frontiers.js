/** ******************************************************************************************************************
 * @file Calculates dominanace frontiers from a dominator tree.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 11-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { isArray: array } = Array,
    { normalize, reverse_graph, simpleRefToSelf } = require( './utils' ),
    consistent = list => list.map( l => array( l ) ? l : typeof l === 'number' ? [ l ] : [] );

// /**
//  * @param {Array<Array<number>>} succs
//  */
// function reverse_flow( succs )
// {
//     if ( !array( succs ) )
//         throw new TypeError( `The list of successor lists must be an array` );
//
//     return simpleRefToSelf( normalize( succs ) );
// }

/**
 * Find dominance frontiers
 *
 * @param {Array<Array<number>>} vertices
 * @param {Array<?number>} idoms
 */
function check( vertices, idoms )
{
    if ( !array( idoms ) || !array( vertices ) )
        throw new TypeError( `Both predecessors and immediate dominators must be arrays` );

    if ( vertices.length !== idoms.length )
        throw new Error( `Both predecessors and immediate dominators must be arrays of equal length` );

    if ( vertices.length < 2 ) return vertices.length ? [ [] ] : [];
}

/**
 * Find dominance frontiers
 *
 * @param {Array<Array<number>>} preds
 * @param {Array<?number>} idoms
 */
function frontiers_from_preds( preds, idoms )
{
    const
        frontiers = [],
        trivial = check( preds, idoms );

    if ( trivial ) return trivial;

    preds = consistent( preds );

    preds.forEach( ( p, i ) => frontiers.push( new Set() ) );

    preds.forEach( ( edges, b ) => {

        if ( edges.length < 2 ) return;

        edges.forEach( runner => {
            while ( runner !== idoms[ b ] )
            {
                frontiers[ runner ].add( b );
                runner = idoms[ runner ];
            }
        } );
    } );

    return frontiers.map( df => [ ...df ] );
}

/**
 * Find dominance frontiers
 *
 * @param {Array<Array<number>>} succs
 * @param {Array<?number>} idoms
 */
function frontiers_from_succs( succs, idoms )
{
    return frontiers_from_preds( reverse_graph( normalize( succs ) ), idoms );
}

module.exports = { frontiers_from_preds, frontiers_from_succs };
