/** ******************************************************************************************************************
 * @file Utilities for graph manipulation.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @date 14-Dec-2017
 *********************************************************************************************************************/
"use strict";

/**
 * @param {Array<Array<number>>} nodes
 * @return {Array<Array<number>>}}
 */
function succs_to_preds( nodes )
{
    const preds = nodes.map( () => [] );

    nodes.forEach( ( succs, i ) => succs.forEach( s => preds[ s ].push( i ) ) );

    return preds;
}

/**
 * @param {Array<Array<number>>} nodes
 * @return {Array<Array<number>>}}
 */
function preds_to_succs( nodes )
{
    const succs = nodes.map( () => [] );

    nodes.forEach( ( preds, i ) => preds.forEach( p => succs[ p ].push( i ) ) );

    return succs;
}

module.exports = {
    succs_to_preds,
    preds_to_succs,
    /**
     * @param {Array<Array<number>|number>} nodes
     * @return {Array<Array<number>>}}
     */
    normalize: nodes => nodes.map( targets => Array.isArray( targets ) ? targets : typeof targets === 'number' ? [ targets ] : [] )
};

