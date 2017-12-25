/** ******************************************************************************************************************
 * @file Description of file here.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date Sun Dec 10 2017
 *********************************************************************************************************************/
"use strict";

module.exports = Object.assign( {},
    require( './src/frontiers' ),
    require( './src/utils' ),
    require( './src/dom-tree' ),
    {
        lt:        require( './src/lt' ),
        iterative: require( './src/fast-iterative' )
    }
);
