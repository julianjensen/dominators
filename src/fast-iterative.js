/** ******************************************************************************************************************
 * @file Implements a near-linear time iterative dominator generator based on this
 * paper: (A Simple, Fast Dominance Algorithm)[https://www.cs.rice.edu/~keith/Embed/dom.pdf]
 * Citation:
 * Cooper, Keith & Harvey, Timothy & Kennedy, Ken. (2006). A Simple, Fast Dominance Algorithm. Rice University, CS Technical Report 06-33870
 *
 * @author Julian Jensen <jjdanois@gmail.com>
 * @date 10-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { normalize, succs_to_preds } = require( './utils' ),
    { DFS } = require( 'traversals' );

/**
 * Implements a near-linear time iterative dominator generator based on this
 * paper: (A Simple, Fast Dominance Algorithm)[https://www.cs.rice.edu/~keith/Embed/dom.pdf]
 * Citation:
 * Cooper, Keith & Harvey, Timothy & Kennedy, Ken. (2006). A Simple, Fast Dominance Algorithm. Rice University, CS Technical Report 06-33870
 *
 * @param {Array<Array<number>|number>} succs
 * @param {number} [startIndex=0]
 * @param {boolean} [flat=true]
 * @return {Array<number>}
 */
function iterative( succs, startIndex = 0, flat = true )
{
    const
        idoms = [];

    let changed = true;

    const
        /** @type {Array<Array<number>>} */
        nsuccs = normalize( succs ),
        preds = succs_to_preds( nsuccs ),
        nodes = [];

    nsuccs.forEach( ( succs, i ) => {
        nodes.push( { id: i, preds: preds[ i ], succs, post: null } );
    } );

    nodes.forEach( () => idoms.push( null ) );

    idoms[ startIndex ] = startIndex;

    /**
     * @param {number} index
     * @private
     */
    function find_idoms( index )
    {
        if ( index === startIndex ) return;

        const b = nodes[ index ];

        let idom = null;

        b.preds.forEach( p => {
            if ( idoms[ p ] === null ) return;
            if ( idom === null )
                idom = p;
            else
            {
                let finger1 = nodes[ p ],
                    finger2 = nodes[ idom ];

                while ( finger1.post !== finger2.post )
                {
                    while ( finger1.post < finger2.post )
                        finger1 = nodes[ idoms[ finger1.id ] ];
                    while ( finger2.post < finger1.post )
                        finger2 = nodes[ idoms[ finger2.id ] ];
                }

                idom = finger1.id;
            }
        } );

        if ( idoms[ b.id ] !== idom )
        {
            idoms[ b.id ] = idom;
            changed = true;
        }
    }

    const
        cbs = {
            rpost: find_idoms,
            post: ( id, postNum ) => nodes[ id ].post = postNum,
            startIndex,
            flat
        };

    while ( changed )
    {
        changed = false;
        DFS( nodes.map( n => n.succs ), cbs );
        cbs.post = void 0;
    }

    idoms[ startIndex ] = null;
    return idoms;
}

module.exports = iterative;
