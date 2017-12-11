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
 * @param {boolean} [impl="normal"]
 * @return {Array<number>}
 */
function YALT( nodes, rootIndex = 0, impl = 'normal' )
{
    let parent   = [],
        semi     = [],
        idom     = [],
        ancestor = [],
        best     = [],
        bucket   = [],
        child    = [],
        size     = [],

        _link    = ( v, w ) => ancestor[ w ] = v,

        _simple_eval = ( v ) => {
            let a = ancestor[ v ];

            if ( a === -1 ) return v;

            while ( ancestor[ a ] !== -1 )
            {
                if ( semi[ v ] > semi[ a ] ) v = a;
                a = ancestor[ a ];
            }

            return v;
        },

        _compress    = v => {
            const a = ancestor[ v ];

            if ( a === -1 ) return;

            _compress( a );

            if ( semi[ best[ v ] ] > semi[ best[ a ] ] )
                best[ v ] = best[ a ];

            ancestor[ v ] = ancestor[ a ];
        },

        _eval        = v => {
            if ( ancestor[ v ] === -1 ) return v;
            _compress( v );
            return best[ v ];
        },

        _slink       = ( w ) => {
            let s = w,
                v = parent[ w ];

            do
            {
                let cs  = child[ s ],
                    bcs = cs !== -1 ? best[ cs ] : -1;

                if ( cs !== -1 && semi[ best[ w ] ] < semi[ bcs ] )
                {
                    let ccs  = child[ cs ],
                        ss   = size[ s ],
                        scs  = size[ cs ],
                        sccs = ccs !== -1 ? size[ ccs ] : 0;

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
            while ( s !== -1 )
            {
                ancestor[ s ] = v;
                s = child[ s ];
            }
        },

        flat         = { link: _link, eeval: _simple_eval },
        normal       = { link: _link, eeval: _eval },
        large        = { link: _slink, eeval: _eval },
        { eeval, link } = impl === 'normal' ? normal : impl === 'flat' ? flat : impl = 'large' ? large : normal;

    nodes.forEach( ( n, i ) => {
        // parent[ i ] = n.parent ? n.parent.id : -1;
        child[ i ] = -1;
        // outEdges[ i ] = ( postDom ? n.succs : n.preds ).map( s => s.id );
        semi[ i ] = i;
        ancestor[ i ] = -1;
        best[ i ] = i;
        bucket[ i ] = [];
    } );

    parent[ rootIndex ] = -1;

    DFS( nodes, {
        edge: { tree: ( from, to ) => parent[ to ] = from },
        rpre:    w => {

            if ( w === rootIndex ) return;

            const
                p = parent[ w ];

            for ( const v of nodes[ w ] )
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
                idom[ v ] = semi[ u ] < p ? u : p;  // idom[ v ] = semi[ u ] < semi[ v ] ? u : p;
            }

            bucket[ p ].length = 0;
        }
    } );

    nodes.forEach( ( node, w ) => {
        if ( w === rootIndex ) return;

        if ( idom[ w ] !== semi[ w ] )
            idom[ w ] = idom[ idom[ w ] ];
    } );

    idom[ rootIndex ] = void 0;

    return idom;
}

module.exports = YALT;


const
    testGraph = [
        [ 1, 8 ],    // start
        [ 2, 3 ],    // a
        [ 3 ],       // b
        [ 4, 5 ],    // c
        [ 6 ],       // d
        [ 6 ],       // e
        [ 7, 2 ],    // f
        [ 8 ],       // g
        []           // end
    ];

const nodes = [];

testGraph.forEach( ( succs, i ) => {
    nodes.push( { id: i, preds: [], succs, post: null } );
} );

nodes.forEach( ( n, i ) => n.succs.forEach( s => nodes[ s ].preds.push( i ) ) );

const
    ri = YALT( nodes.map( n => n.preds ) );

nodes.forEach( ( n, i ) => {
    console.log( `node ${i + 1} -> ${ri[ i ] + 1}` );
} );
// console.log( 'ri:', ri );


