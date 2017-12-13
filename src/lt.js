/** ******************************************************************************************************************
 * @file Describe what lt does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 12-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { DFS } = require( 'traversals' );

/**
 *
 * @param {Array<Array<number>>} nodes
 * @param {number} [startIndex=0]
 * @param {boolean} [flat=true]
 */
function lt( { nodes, startIndex = 0, flat = true } )
{
    nodes = nodes.map( n => typeof n === 'number' ? [ n ] : n );

    const
        _link = ( v, w ) => w.ancestor = v,

        simple_eval = v => {
            let a = v.ancestor;

            if ( a === null ) return v;

            while ( a.ancestor !== null )
            {
                if ( v.semi.pre > a.semi.pre )
                    v = a;
                a = a.ancestor;
            }

            return v;
        },

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
            ancestor: null,
            toString()
            {
                return `id: ${this.id + 1}, pre: ${this.pre + 1}, semi: ${this.semi ? this.semi.pre : '-'}, idom: ${this.idom ? this.idom.pre : '-'}`;
            }
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
        }
    } );

    listOrder.forEach( node => node.succs.forEach( s => listOrder[ s ].preds.push( node ) ) );

    // preOrder.forEach( p => console.log( `${p}` ) );

    for ( let i = preOrder.length - 1; i > 0; --i )
    {
        const
            w = preOrder[ i ],
            p = w.parent;

        if ( !w.id ) continue;

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
    return listOrder.map( n => n.idom ? n.idom.pre : null );
    // return listOrder;
}

// const
//     // testGraph = [
//     //     [ 1, 8 ],    // start
//     //     [ 2, 3 ],    // a
//     //     [ 3 ],       // b
//     //     [ 4, 5 ],    // c
//     //     [ 6 ],       // d
//     //     [ 6 ],       // e
//     //     [ 7, 2 ],    // f
//     //     [ 8 ],       // g
//     //     []           // end
//     // ],
//     // r = 0,
//     // a = 1,
//     // b = 2,
//     // c = 3,
//     // d = 4,
//     // e = 5,
//     // f = 6,
//     // g = 7,
//     // h = 8,
//     // i = 9,
//     // j = 10,
//     // k = 11,
//     // l = 12,
//     //
//     // rlarger   = [
//     //     [ c, b, a ],    // r
//     //     [ d ],          // a
//     //     [ e, a, d ],    // b
//     //     [ f, g ],       // c
//     //     [ l ],          // d,
//     //     [ h ],          // e
//     //     [ i ],          // f
//     //     [ j, i ],       // g
//     //     [ e, k ],       // h
//     //     [ k ],          // i
//     //     [ i ],          // j
//     //     [ i, r ],       // k
//     //     [ h ]           // l
//     // ],
//
// const
//     graph  = require( '../data/lengtarj.json' ),
//     result = lt( { nodes: graph.graph, startIndex: 0, flat: true } );
// // result = lt( testGraph );s
//
// // console.log( result.map( n => typeof n === 'number' ? n + 1 : n ) );
// // console.log( graph.idom.map( n => n === null ? '-' : n + 1 ) );
//
// result.forEach( ( node, i ) => {
//     const
//         two = n => n < 10 ? ' ' + n : n,
//         data = n => n === null ? ' -' : two( n + 1 ),
//         res = n => typeof n === 'number' ? two( n + 1 ) : ' ' + n,
//         idom = node.idom ? node.idom.pre : '-',
//         sdom = node.semi ? node.semi.pre + 1: '-';
//
//     console.log( `${two( i + 1 )}: ${res( idom )} => ${data( graph.idom[ i ] )}, semi: ${two( sdom )} => ${data( graph.semi[ i ] )}` );
// } );
// console.log( 'result:', result );
module.exports = lt;
