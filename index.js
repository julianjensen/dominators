/** ******************************************************************************************************************
 * @file Description of file here.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date Sun Dec 10 2017
 *********************************************************************************************************************/
"use strict";

// const
//     {
//         frontiers_from_preds,
//         frontiers_from_succs
//     }                                                                             = require( './src/frontiers' ),
//     { preds_to_succs, succs_to_preds, normalize, reverse_graph, simpleRefToSelf, arrayOfArrays, create_dom_tree } = require( './src/utils' ),
//     {
//         create_levels,
//         create_j_edges,
//         create_nodes,
//         create_dj_graph,
//         make_dom
//     }                                                                             = require( './src/dom-tree' );

module.exports = Object.assign( {},
    require( './src/frontiers' ),
    require( './src/utils' ),
    require( './src/dom-tree' ),
    {
        lt:        require( './src/lt' ),
        iterative: require( './src/fast-iterative' )
    }
);
// module.exports = {
//     lt:        require( './src/lt' ),
//     iterative: require( './src/fast-iterative' ),
//     frontiers_from_preds,
//     frontiers_from_succs,
//     reverse_flow,
//     succs_to_preds,
//     preds_to_succs,
//     normalize
// };
