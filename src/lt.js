/** ******************************************************************************************************************
 * @file Describe what lt does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 12-Dec-2017
 *********************************************************************************************************************/
"use strict";

const
    { DFS } = require( 'traversals' );

function lt( nodes )
{
    const
        _link = w => w.ancestor = w.parent,
        _compress = v => {
            const u = v.ancestor;

            if ( u === null ) return;

            _compress( u );

            if ( v.best.semi.pre > u.best.semi.pre )
                v.best = u.best;

            v.ancestor = u.ancestor;
        },

        _eval     = v => {
            if ( v.ancestor === null ) return v;
            _compress( v );
            return v.best;
        },

        listOrder = nodes.map( ( succs, id ) => ( {
            id,
            pre:      -1,
            succs,
            preds:    [],
            parent:   null,
            semi:     null,
            idom:     null,
            ancestor: null,
            best:     null,
            bucket:   []
        } ) ),
        preOrder = [];

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

    for ( let i = preOrder.length - 1; i > 0; --i )
    {
        const
            w = preOrder[ i ],
            p = w.parent;

        if ( !p ) continue;

        w.preds.forEach( v => {
            const u = _eval( v );

            if ( w.semi.pre > u.semi.pre )
                w.semi = u.semi;
        } );

        w.semi.bucket.push( w );

        _link( w );

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

    return listOrder.map( n => n.idom ? n.idom.pre : '-' );
    // return listOrder;
}

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
    ],
    r = 0,
    a = 1,
    b = 2,
    c = 3,
    d = 4,
    e = 5,
    f = 6,
    g = 7,
    h = 8,
    i = 9,
    j = 10,
    k = 11,
    l = 12,

    rlarger   = [
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
    result = lt( rlarger );
    // result = lt( testGraph );

console.log( result );

