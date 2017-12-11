/** ******************************************************************************************************************
 * @file Yet another Lengauer & Tarjan implementation with variations. From this paper:
 * Thomas Lengauer and Robert Endre Tarjan. 1979. A fast algorithm for finding dominators in a flowgraph. ACM Trans. Program. Lang. Syst. 1, 1 (January 1979), 121-141.
 * DOI=http://dx.doi.org/10.1145/357062.357071
 *
 * You can find a link to it here (and many other places, in case this link goes bad):
 * (A fast algorithm for finding dominators in a flowgraph)[https://www.cs.princeton.edu/courses/archive/fall03/cs528/handouts/a%20fast%20algorithm%20for%20finding.pdf]
 *
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 10-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { DFS } = require( 'traversals' );


/**
 * @param {Array<Array<number>>} nodes
 * @param {number} [rootIndex=0]
 * @param {string} [impl="normal"]
 * @return {Array<number>}
 */
function yalt( nodes, rootIndex = 0, impl = 'normal' )
{
    let parent   = [],
        semi     = [],
        idom     = [],
        ancestor = [],
        best     = [],
        bucket   = [],
        child    = [],
        size     = [],

        succs = nodes,
        preds = [],

        _link    = ( v, w ) => ancestor[ w ] = v,

        _simple_eval = ( v ) => {
            let a = ancestor[ v ];

            if ( a === null ) return v;

            while ( ancestor[ a ] !== null )
            {
                if ( semi[ v ] > semi[ a ] ) v = a;
                a = ancestor[ a ];
            }

            return v;
        },

        _compress    = v => {
            const a = ancestor[ v ];

            if ( a === null ) return;

            _compress( a );

            if ( semi[ best[ v ] ] > semi[ best[ a ] ] )
                best[ v ] = best[ a ];

            ancestor[ v ] = ancestor[ a ];
        },

        _eval        = v => {
            if ( ancestor[ v ] === null ) return v;
            _compress( v );
            return best[ v ];
        },

        _slink       = ( w ) => {
            let s = w,
                v = parent[ w ];

            do
            {
                let cs  = child[ s ],
                    bcs = cs !== null ? best[ cs ] : null;

                if ( cs !== null && semi[ best[ w ] ] < semi[ bcs ] )
                {
                    let ccs  = child[ cs ],
                        ss   = size[ s ],
                        scs  = size[ cs ],
                        sccs = ccs !== null ? size[ ccs ] : 0;

                    if ( ss - scs >= scs - sccs )
                        child[ s ] = ccs;
                    else
                    {
                        size[ cs ] = ss;
                        ancestor[ s ] = cs;
                        s = cs;
                    }
                }
                else
                    break;
            }
            while ( true );

            best[ s ] = best[ w ];
            if ( size[ v ] < size[ w ] )
            {
                let t = s;
                s = child[ v ];
                child[ v ] = t;
            }
            size[ v ] = size[ v ] + size[ w ];
            while ( s !== null )
            {
                ancestor[ s ] = v;
                s = child[ s ];
            }
        },

        flat         = { link: _link, eeval: _simple_eval },
        normal       = { link: _link, eeval: _eval },
        large        = { link: _slink, eeval: _eval },
        { eeval, link } = impl === 'normal' ? normal : impl === 'flat' ? flat : impl = 'large' ? large : normal;

    nodes.forEach( ( _succs, i ) => {

        child[ i ] = null;
        semi[ i ] = i;
        ancestor[ i ] = null;
        best[ i ] = i;
        bucket[ i ] = [];
        idom[ i ] = null;

        preds.push( [] );
    } );

    succs.forEach( ( _succs, i ) => {
        _succs.forEach( s => {
            if ( !preds[ s ].length )
                parent[ s ] = i;

            preds[ s ].push( i );
        } );
    } );

    parent[ rootIndex ] = null;

    DFS( succs, {
        rpre:    w => {

            if ( w === rootIndex ) return;

            const
                p = parent[ w ];

            for ( const v of preds[ w ] )
            {
                const u = eeval( v );

                if ( semi[ w ] > semi[ u ] )
                    semi[ w ] = semi[ u ];
            }

            bucket[ semi[ w ] ].push( w );
            link( w ); // _slink( w ) for faster version (but slower under real conditions)

            for ( const v of bucket[ p ] )
            {
                const u = eeval( v );
                // idom[ v ] = semi[ u ] < p ? u : p;
                idom[ v ] = semi[ u ] < semi[ v ] ? u : p;
            }

            bucket[ p ].length = 0;
        }
    } );

    nodes.forEach( ( node, w ) => {
        if ( w === rootIndex ) return;

        if ( idom[ w ] !== semi[ w ] )
            idom[ w ] = idom[ idom[ w ] ];
    } );

    idom[ rootIndex ] = null;

    return idom;
}

module.exports = yalt;
