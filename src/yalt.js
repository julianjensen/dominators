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
    { DFS, BFS } = require( 'traversals' );


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

        succs    = nodes,
        preds    = [],

        _link    = ( w ) => ancestor[ w ] = parent[ w ],

        _simple_eval    = ( v ) => {
            let a = ancestor[ v ];

            if ( a === null ) return v;

            while ( ancestor[ a ] !== null )
            {
                if ( semi[ v ] > semi[ a ] ) v = a;
                a = ancestor[ a ];
            }

            return v;
        },

        _compress       = v => {
            const u = ancestor[ v ];

            if ( u === null ) return;

            _compress( u );

            if ( semi[ best[ u ] ] < semi[ best[ v ] ] )
                best[ v ] = best[ u ];

            ancestor[ v ] = ancestor[ u ];
        },

        _eval           = v => {
            if ( ancestor[ v ] === null ) return v;
            _compress( v );
            return best[ v ];
        },

        _slink          = ( w ) => {
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

        flat            = { link: _link, eeval: _simple_eval },
        normal          = { link: _link, eeval: _eval },
        large           = { link: _slink, eeval: _eval },
        { eeval, link } = { link: _link, eeval: _eval }, // impl === 'normal' ? normal : impl === 'flat' ? flat : impl === 'large' ? large : normal,
        init_to_null    = ( a, lng ) => {
            for ( let _ = 0; _ < lng; _++ )
                a[ _ ] = null;
        };

    const
        nice    = c => c === void 0 || c === null ? 'u' : c === 0 ? 'r' : String.fromCharCode( 0x60 + c ),
        niceNum = n => n + 1 > 9 ? '' + ( n + 1 ) : ' ' + ( n + 1 );

    if ( impl === 'snik' ) console.log( 'prnt:', parent.map( c => ' ' + nice( c ) ).join( ' ' ) );

    // const
    //     index2pre = [],
    //     pre2index = [];
    //
    //
    // DFS( succs, {
    //     pre: ( preNum, preOrder ) => {
    //         index2pre[ preNum ] = preOrder;
    //         pre2index[ preOrder ] = preNum;
    //
    //         semi[ preOrder ] = preOrder;
    //         best[ preOrder ] = preOrder;
    //         bucket[ preOrder ] = new Set();
    //
    //         child[ preOrder ] = null;
    //         ancestor[ preOrder ] = null;
    //
    //         preds[ preOrder ] = [];
    //     }
    // } );

    // index2pre.forEach( ( p, i ) => {
    //     console.log( `node index: ${i + 1} => ${p + 1}` );
    // } );

    nodes.forEach( ( _succs, i ) => {

        child[ i ] = null;
        semi[ i ] = i;
        ancestor[ i ] = null;
        best[ i ] = i;
        bucket[ i ] = new Set();

        preds.push( [] );
    } );

    succs.forEach( ( _succs, i ) => {
        _succs.forEach( s => {
            // s = index2pre[ s ];
            // i = index2pre[ i ];

            // if ( !preds[ s ].length )
            //     parent[ s ] = i;
            //
            // if ( parent[ s ] === null || parent[ s ] < i )
            //     parent[ s ] = i;

            preds[ s ].push( i );
        } );
    } );

    // parent[ index2pre[ rootIndex ] ] = null;
    parent[ 0 ] = null;
    // semi[ 0 ] = null;


    DFS( succs, {
        edge: {
            tree: ( from, to ) => parent[ to ] = from
            // tree: ( from, to ) => best[ to ] = parent[ to ] = from
        } } );

    console.log( 'parent:' );
    nodes.forEach( ( x, n ) => {
        console.log( `${n + 1}: ${parent[ n ] === null ? '-' : parent[ n ] + 1}, preds: ${preds[ n ].map( p => p + 1 ).join( ' ' )}` );
    } );

    DFS( succs, {
        excludeRoot: true,
        // pre: ( pre, seq ) => impl === 'snik' && console.log( `pre: ${nice( pre )}, seq: ${nice( seq )}` ),
        rpre:        w => {

            semi[ w ] = w;
            // if ( w === rootIndex ) return;

            const
                p = parent[ w ];

            for ( const v of preds[ w ] )
            {
                const u = eeval( v );

                // semi[ w ] = Math.min( semi[ w ], semi[ x ] );
                if ( semi[ u ] < semi[ w ] )
                    semi[ w ] = semi[ u ];
            }

            // if ( !bucket[ semi[ w ] ] )
            //     console.log( 'boom w:', w );
            //     console.log( 'boom semi[ w ]:', semi[ w ] );
            bucket[ semi[ w ] ].add( w );
            link( w ); // _slink( w ) for faster version (but slower under real conditions)

            for ( const v of bucket[ p ] )
            {
                const y = eeval( v );
                // idom[ v ] = semi[ y ] < p ? y : p;
                idom[ v ] = semi[ y ] < semi[ v ] ? y : p;
            }

            bucket[ p ].clear();
            // bucket[ p ].length = 0;
        }
    } );

    // console.log( 'parent:' );
    // index2pre.forEach( ( pre, id ) => {
    //     console.log( `${id + 1}: ${parent[ pre ] + 1}` );
    // } );

    console.log( 'semi:' );
    nodes.forEach( ( pre, id ) => {
        console.log( `${id + 1}: ${semi[ id ] + 1}` );
    } );

    console.log( 'idom:' );
    nodes.forEach( ( pre, id ) => {
        console.log( `${id + 1}: ${idom[ id ] + 1}` );
    } );
    // if ( impl === 'snik' ) console.log( 'semi:', semi.map( s => fixed.preNodes[ s ] + 1 ).map( niceNum ).join( ' ' ) );
    // if ( impl === 'snik' ) console.log( 'idom:', idom.map( c => ' ' + nice( c ) ).join( ' ' ) );

    DFS( succs, {
        excludeRoot: true,
        pre:         w => {
            if ( idom[ w ] !== semi[ w ] )
                idom[ w ] = idom[ idom[ w ] ];
        }
    } );
    // nodes.forEach( ( node, w ) => {
    //     if ( w === rootIndex ) return;
    //
    //     if ( idom[ w ] !== semi[ w ] )
    //         idom[ w ] = idom[ idom[ w ] ];
    // } );

    idom[ rootIndex ] = null;

    // return idom.map( n => pre2index[ n ] );
    // return fixed.toIndex( idom );
    return idom;
}

function nodes_to_pre( nodes, rootIndex )
{
    const
        index2pre = [],
        preNodes  = [];

    DFS( nodes, {
        pre: ( nodeNum, preOrder ) => {
            preNodes[ preOrder ] = nodeNum;
            index2pre[ nodeNum ] = preOrder;
        }
    } );

    nodes = nodes.map( succs => succs.map( s => index2pre[ s ] ) );
    return { rootIndex: index2pre[ rootIndex ], preNodes, preOrdered: nodes.map( ( n, i ) => nodes[ index2pre[ i ] ] ), toIndex: idoms => idoms.map( n => preNodes[ n ] ) };
}

module.exports = yalt;

let
    r       = 0,
    a       = 1,
    b       = 2,
    c       = 3,
    d       = 4,
    e       = 5,
    f       = 6,
    g       = 7,
    h       = 8,
    i       = 9,
    j       = 10,
    k       = 11,
    l       = 12,

    dfs = [
        r, c, f, i, k, g, j, b, e, h, a, d, l
    ],
    rlarger = [
        [ c, b, a ],    // r
        [ d ],          // a
        [ e, a, d ],    // b
        [ f, g ],       // c
        [ l ],          // d,
        [ h ],          // e
        [ i ],          // f
        [ j, i ],       // g
        [ e, k ],       // h
        [ k ],          // i
        [ i ],          // j
        [ i, r ],       // k
        [ h ]           // l
    ],
    oneBased = [
        [ 2, 8, 11 ],   // 1
        [ 3, 6 ],       // 2
        [ 4 ],          // 3
        [ 5 ],          // 4
        [ 4, 1 ],       // 5
        [ 7, 4 ],       // 6
        [ 4 ],          // 7
        [ 9, 11, 12 ],  // 8
        [ 10 ],         // 9
        [ 9, 5 ],       // 10
        [ 12 ],         // 11
        [ 13 ],         // 12
        [ 10 ]          // 13
    ];

oneBased = oneBased.map( arr => arr.map( n => n - 1 ) );

const result = yalt( oneBased );
console.log( 'final idoms:', result );
