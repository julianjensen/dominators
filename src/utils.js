/** ******************************************************************************************************************
 * @file Utilities for graph manipulation.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @date 14-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
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
    // nullable_ref_to_self: nodes => condRefToSelf( nodes, notNull ),
    // joinsets_ref_to_self: nodes => condRefToSelf( nodes, twoOrMore ),

    /**
     * @param {Array<Array<number>|number>} nodes
     * @return {Array<Array<number>>}}
     */
    normalize: nodes => nodes.map( targets => Array.isArray( targets ) ? targets : typeof targets === 'number' ? [ targets ] : [] )
};

