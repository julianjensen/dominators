/** ******************************************************************************************************************
 * @file Description of file here.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date Sun Dec 10 2017
 *********************************************************************************************************************/
"use strict";

const
    expect = require( 'chai' ).expect,
    { iterative: iter, yalt, frontiers_from_preds, frontiers_from_succs, reverse_flow } = require( '../index' ),
    r = `          ┌─────────┐
┌─────────┤ START 0 │
│         └────┬────┘
│              │
│              V
│            ┌───┐
│     ┌──────┤ 1 │
│     │      └─┬─┘
│     │        │
│     │        V
│     │      ┌───┐
│     │      │ 2 │<───────────┐
│     │      └─┬─┘            │
│     │        │              │
│     │        V              │
│     │      ┌───┐            │
│     └─────>│   │            │
│     ┌──────┤ 3 ├──────┐     │
│     │      └───┘      │     │
│     │                 │     │
│     V                 V     │
│   ┌───┐             ┌───┐   │
│   │ 4 │             │ 5 │   │
│   └─┬─┘             └─┬─┘   │
│     │                 │     │
│     │                 │     │
│     │      ┌───┐      │     │
│     └─────>│ 6 │<─────┘     │
│            │   ├────────────┘
│            └─┬─┘
│              │
│              V
│            ┌───┐
│            │ 7 │
│            └─┬─┘
│              │
│              V
│         ┌─────────┐
└────────>│  EXIT 8 │
          └─────────┘
`,

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
    preds = [
        [],
        [ 0 ],
        [ 1, 6 ],
        [ 1, 2 ],
        [ 3 ],
        [ 3 ],
        [ 4, 5 ],
        [ 6 ],
        [ 0, 7 ]
    ],
    correctIdoms = [ null, 0, 1, 1, 3, 3, 3, 6, 0 ],
    correctFrontiers = [ [], [ 8 ], [ 3 ], [ 2, 8 ], [ 6 ], [ 6 ], [ 2, 8 ], [ 8 ], [] ];

console.log( r );

describe( 'dominators', function() {

    // describe( 'CHK fast iterative dominator finder', function() {
    //
    //     it( 'should find all immediate dominators', () => {
    //         expect( iter( testGraph ) ).to.eql( correctIdoms );
    //     } );
    //
    // } );

    describe( 'Lengauer-Tarjan dominator finder', function() {

        it( 'should find all immediate dominators', () => {
            expect( yalt( testGraph ) ).to.eql( correctIdoms );
        } );

        it( 'should find all immediate dominators in flat mode', () => {
            expect( yalt( testGraph, 0, 'flat' ) ).to.eql( correctIdoms );
        } );

        it( 'should find all immediate dominators in large mode', () => {
            expect( yalt( testGraph, 0, 'large' ) ).to.eql( correctIdoms );
        } );

    } );

    describe( 'Dominanace frontiers', function() {

        it( 'should determine the dominance frontiers from successors', () => {
            expect( frontiers_from_succs.bind( null, testGraph ) ).to.throw( TypeError );
            expect( frontiers_from_succs( testGraph, correctIdoms ) ).to.eql( correctFrontiers );
        } );

        it( 'should create predecessors from successors', () => {
            expect( reverse_flow.bind( null, 'hello' ) ).to.throw( TypeError );
            expect( reverse_flow( testGraph ) ).to.eql( preds );
        } );

        it( 'should determine the dominance frontiers from predecessors', () => {
            expect( frontiers_from_preds.bind( null, testGraph ) ).to.throw( TypeError );
            expect( frontiers_from_preds( preds, correctIdoms ) ).to.eql( correctFrontiers );
        } );

    } );
} );
