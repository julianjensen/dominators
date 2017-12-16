/** ******************************************************************************************************************
 * @file Description of file here.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date Sun Dec 10 2017
 *********************************************************************************************************************/
"use strict";

const { frontiers_from_preds, frontiers_from_succs, reverse_flow } = require( './src/frontiers' ),
      { preds_to_succs, succs_to_preds } = require( './src/utils' );

module.exports = {
    lt: require( './src/lt' ),
    iterative: require( './src/fast-iterative' ),
    frontiers_from_preds,
    frontiers_from_succs,
    reverse_flow,
    succs_to_preds,
    preds_to_succs
};
