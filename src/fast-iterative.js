/** ******************************************************************************************************************
 * @file Implements a near-linear time iterative dominator generator based on this
 * paper: (A Simple, Fast Dominance Algorithm)[https://www.cs.rice.edu/~keith/Embed/dom.pdf]
 * Citation:
 * Cooper, Keith & Harvey, Timothy & Kennedy, Ken. (2006). A Simple, Fast Dominance Algorithm. Rice University, CS Technical Report 06-33870
 *
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 10-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { DFS } = require( 'traversals' );

/**
 * @param {Array<Array<number>>} succs
 * @param {number} [rootIndex=0]
 * @return {Array<number>}
 */
function iterative( succs, rootIndex = 0 )
{
    const
        idoms = [];

    let changed = true;

    const nodes = [];

    succs.forEach( ( _succs, i ) => {
        nodes.push( { id: i, preds: [], succs: _succs, post: null } );
    } );

    nodes.forEach( ( n, i ) => n.succs.forEach( s => nodes[ s ].preds.push( i ) ) );

    nodes.forEach( () => idoms.push( null ) );

    idoms[ rootIndex ] = rootIndex;

    /**
     * @param {number} index
     */
    function find_idoms( index )
    {
        if ( index === rootIndex ) return;

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
            post: ( id, postNum ) => nodes[ id ].post = postNum
        };

    while ( changed )
    {
        changed = false;
        DFS( nodes.map( n => n.succs ), cbs );
        cbs.post = void 0;
    }

    idoms[ rootIndex ] = null;
    return idoms;
}

module.exports = iterative;
