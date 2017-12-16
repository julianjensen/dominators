/** ******************************************************************************************************************
 * @file See README.md for details
 *
 * For the sake of completeness, below is the fast balanaced version of link, which is not included in the current module code
 * for two reasons:
 *
 * 1. The LT algorithm with this LINK only becomes faster than the normal implementation when we're dealing with
 *    10s or 100s of thousands of nodes, in which cases you shouldn't be using JavaScript anyway.
 * 2. I don't have test graph large enough to get proper coverage so, since it's not really useful,
 *    I decided to remove it.
 *
 * This implementation uses arrays rather then an object. That's how I originally implemented this algorithm
 * but that makes it incompatible with the current implementation. I won't convert it since it's not used, however,
 * because it is interesting, I've included it here, for interested parties, of which there will probably be at least
 * zero but not more.
 *
 * @example
 *     balanced_link = ( w ) => {
 *         let s = w,
 *             v = parent[ w ];
 *
 *         do
 *         {
 *             let cs  = child[ s ],
 *                 bcs = cs !== null ? best[ cs ] : null;
 *
 *             if ( cs !== null && semi[ best[ w ] ] < semi[ bcs ] )
 *             {
 *                 let ccs  = child[ cs ],
 *                     ss   = size[ s ],
 *                     scs  = size[ cs ],
 *                     sccs = ccs !== null ? size[ ccs ] : 0;
 *
 *                 if ( ss - scs >= scs - sccs )
 *                     child[ s ] = ccs;
 *                 else
 *                 {
 *                     size[ cs ] = ss;
 *                     ancestor[ s ] = cs;
 *                     s = cs;
 *                 }
 *             }
 *             else
 *                 break;
 *         }
 *         while ( true );
 *
 *         best[ s ] = best[ w ];
 *         if ( size[ v ] < size[ w ] )
 *         {
 *             let t = s;
 *             s = child[ v ];
 *             child[ v ] = t;
 *         }
 *         size[ v ] = size[ v ] + size[ w ];
 *         while ( s !== null )
 *         {
 *             ancestor[ s ] = v;
 *             s = child[ s ];
 *         }
 *     }
 *
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 12-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { normalize } = require( './utils' ),
    { DFS } = require( 'traversals' );

/**
 *
 * @param {Array<Array<number>>} nodes
 * @param {number} [startIndex=0]
 * @param {boolean} [flat=true]
 */
function lt( nodes, startIndex = 0, flat = true )
{
    nodes = normalize( nodes );

    const
        _link = ( v, w ) => w.ancestor = v,

        flat_compress = v => {

            if ( !v.ancestor || !v.ancestor.ancestor ) return;

            const stack = [];

            for ( let b = v; b; b = b.ancestor )
                stack.push( b );

            for ( let i = stack.length - 2; i--; )
            {
                const
                    b = stack[ i ],
                    a = b.ancestor;

                if ( a.best.semi.pre < b.best.semi.pre )
                    b.best = a.best;

                b.ancestor = a.ancestor;
            }

        },

        flat_eval = v => {
            if ( v.ancestor === null ) return v;
            flat_compress( v );
            return v.best;
        },

        recur_compress = v => {
            const a = v.ancestor;

            if ( a === null || a.ancestor === null ) return;

            recur_compress( a );

            if ( a.best.semi.pre < v.best.semi.pre )
                v.best = a.best;

            v.ancestor = a.ancestor;
        },

        recur_eval     = v => {
            if ( v.ancestor === null ) return v;
            recur_compress( v );
            return v.best;
        },
        _eval = flat ? flat_eval : recur_eval,

        listOrder = nodes.map( ( succs, id ) => ( {
            id,
            pre:    id,
            succs,
            preds:  [],
            parent: null,
            semi:   null,
            best:   null,
            bucket: [],

            idom:     null,
            ancestor: null
        } ) );

    let preOrder = [];

    DFS( listOrder.map( n => n.succs ), {
        edge: {
            tree: ( from, to ) => listOrder[ to ].parent = listOrder[ from ]
        },
        pre: ( preNum, preIndex ) => {
            const node = listOrder[ preNum ];

            node.pre = preIndex;
            node.semi = node;
            node.best = node;

            preOrder.push( node );
        },
        flat,
        startIndex
    } );

    listOrder.forEach( node => node.succs.forEach( s => listOrder[ s ].preds.push( node ) ) );

    for ( let i = preOrder.length; --i > 0; )
    {
        const
            w = preOrder[ i ],
            p = w.parent;

        w.preds.forEach( v => {
            const u = _eval( v );

            if ( w.semi.pre > u.semi.pre )
                w.semi = u.semi;
        } );

        w.semi.bucket.push( w );

        _link( p, w );

        p.bucket.forEach( v => {
            const u = _eval( v );

            v.idom = u.semi.pre < v.semi.pre ? u : p;
        } );

        p.bucket = [];
    }

    preOrder.forEach( w => {
        if ( w.parent && w.idom.pre !== w.semi.pre )
            w.idom = w.idom.idom;
    } );

    preOrder[ 0 ].idom = null;
    return listOrder.map( n => n.idom ? n.idom.id : null );
}

module.exports = lt;
