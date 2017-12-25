/** ******************************************************************************************************************
 * @file This file holds all the tests for the dominator tree utilities.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 24-Dec-2017
 *********************************************************************************************************************/
"use strict";
/* eslint-env mocha, chai */

const
    expect              = require( 'chai' ).expect,
    { graph }           = require( '../data/dj.json' ),
    { normalize }       = require( '../src/utils' ),
    {
        make_dom
    }                   = require( '../src/dom-tree' ),
    {
        create_levels,
        create_dj_graph,
        create_nodes,
        create_j_edges,
        create_dom_tree
    } = require( '../src/utils' ),
    iterative           = require( '../src/fast-iterative' ),
    nodes               = [
        {
            id:       0,
            succs:    [ 1 ],
            preds:    [],
            domSuccs: [ 1 ],
            idom:     undefined,
            level:    0,
            domLevel: 0,
            jSuccs:   [],
            jPreds:   []
        },
        {
            id:       1,
            succs:    [ 2, 10 ],
            preds:    [ 0, 6 ],
            domSuccs: [ 2, 10 ],
            idom:     0,
            level:    1,
            domLevel: 1,
            jSuccs:   [],
            jPreds:   [ 6 ]
        },
        {
            id:       2,
            succs:    [ 3, 7 ],
            preds:    [ 1 ],
            domSuccs: [ 3, 4, 5, 7 ],
            idom:     1,
            level:    2,
            domLevel: 2,
            jSuccs:   [],
            jPreds:   []
        },
        {
            id:       3,
            succs:    [ 4 ],
            preds:    [ 2 ],
            domSuccs: [],
            idom:     2,
            level:    3,
            domLevel: 3,
            jSuccs:   [ 4 ],
            jPreds:   []
        },
        {
            id:       4,
            succs:    [ 5 ],
            preds:    [ 3, 5 ],
            domSuccs: [],
            idom:     2,
            level:    4,
            domLevel: 3,
            jSuccs:   [ 5 ],
            jPreds:   [ 3, 5 ]
        },
        {
            id:       5,
            succs:    [ 4, 6 ],
            preds:    [ 4, 8 ],
            domSuccs: [ 6 ],
            idom:     2,
            level:    5,
            domLevel: 3,
            jSuccs:   [ 4 ],
            jPreds:   [ 4, 8 ]
        },
        {
            id:       6,
            succs:    [ 1 ],
            preds:    [ 5 ],
            domSuccs: [],
            idom:     5,
            level:    6,
            domLevel: 4,
            jSuccs:   [ 1 ],
            jPreds:   []
        },
        {
            id:       7,
            succs:    [ 8 ],
            preds:    [ 2, 9 ],
            domSuccs: [ 8 ],
            idom:     2,
            level:    3,
            domLevel: 3,
            jSuccs:   [],
            jPreds:   [ 9 ]
        },
        {
            id:       8,
            succs:    [ 5, 9 ],
            preds:    [ 7 ],
            domSuccs: [ 9 ],
            idom:     7,
            level:    4,
            domLevel: 4,
            jSuccs:   [ 5 ],
            jPreds:   []
        },
        {
            id:       9,
            succs:    [ 7 ],
            preds:    [ 8 ],
            domSuccs: [],
            idom:     8,
            level:    5,
            domLevel: 5,
            jSuccs:   [ 7 ],
            jPreds:   []
        },
        {
            id:       10,
            succs:    [],
            preds:    [ 1 ],
            domSuccs: [],
            idom:     1,
            level:    2,
            domLevel: 2,
            jSuccs:   [],
            jPreds:   []
        }
    ];

describe( 'dominator tree utility functions', function() {

    let dom;

    beforeEach( function() {
        dom = make_dom( graph );
    } );

    describe( 'dominator functions', function() {

        it( 'should return dominators lists', () => {

            expect( dom.dominators( 9 ) ).to.eql( [ 9, 8, 7, 2, 1 ] );
            expect( dom.strictDominators( 9 ) ).to.eql( [ 8, 7, 2, 1 ] );

        } );

        it( 'should iterate over dominator lists', () => {

            let domList  = [],
                sdomList = [];

            dom.forDominators( b => domList.push( b ), 9 );
            dom.forStrictDominators( b => sdomList.push( b ), 9 );

            expect( domList ).to.eql( [ 9, 8, 7, 2, 1 ] );
            expect( sdomList ).to.eql( [ 8, 7, 2, 1 ] );

        } );

        it( 'should do dominator tests down the tree', () => {

            expect( dom.dominates( 5, 5 ) ).to.be.true;
            expect( dom.strictlyDominates( 5, 5 ) ).to.be.false;
            expect( dom.dominates( 5, 6 ) ).to.be.true;
            expect( dom.strictlyDominates( 5, 6 ) ).to.be.true;
            expect( dom.dominates( 5, 4 ) ).to.be.false;
            expect( dom.strictlyDominates( 5, 4 ) ).to.be.false;

            expect( dom.dominates( 7 ) ).to.have.members( [ 7, 8, 9 ] );
            expect( dom.strictlyDominates( 7 ) ).to.have.members( [ 8, 9 ] );

        } );

        it( 'should iterate over dominated blocks', () => {
            let dominated = [];

            dom.forDominates( d => dominated.push( d ), 7 );
            expect( dominated ).to.eql( [ 7, 8, 9 ] );
            dominated.length = 0;
            dom.forDominates( d => dominated.push( d ), 2 );
            expect( dominated ).to.have.members( [ 2, 3, 4, 5, 6, 7, 8, 9 ] );
            dominated.length = 0;
            dom.forStrictlyDominates( d => dominated.push( d ), 7 );
            expect( dominated ).to.eql( [ 8, 9 ] );

        } );

    } );

    describe( 'dominance frontiers', function() {

        it( 'should return a dominance frontier', () => {
            expect( dom.dominanceFrontier( 2 ) ).to.have.members( [ 1 ] );
            expect( dom.dominanceFrontier( 5 ) ).to.have.members( [ 1, 4 ] );
            expect( dom.dominanceFrontier( 7 ) ).to.have.members( [ 5, 7 ] );
            expect( dom.dominanceFrontier( 8 ) ).to.have.members( [ 5, 7 ] );
        } );

        it( 'should iterate over a dominance frontier', () => {
            let front = [];

            dom.forDominanceFrontier( f => front.push( f ), 5 );
            expect( front ).to.have.members( [ 1, 4 ] );
            front.length = 0;
            dom.forDominanceFrontier( f => front.push( f ), 7 );
            expect( front ).to.have.members( [ 5, 7 ] );
        } );

        it( 'should return an iterated dominance frontier', () => {

            let DFplus = dom.iteratedDominanceFrontier( [ 0, 2, 3, 6 ] );
            expect( DFplus ).to.have.members( [ 1, 4, 5 ] );
            DFplus = dom.alternative_idf( [ 0, 2, 3, 6 ] );
            expect( DFplus ).to.have.members( [ 1, 4, 5 ] );

        } );

        it( 'should iterate over an iterated dominance frontier', () => {

            let DFplus = [];

            dom.forIteratedDominanceFrontier( dfp => DFplus.push( dfp ), [ 0, 2, 3, 6 ] );
            expect( DFplus ).to.have.members( [ 1, 4, 5 ] );
            DFplus = dom.iteratedDominanceFrontier( [ 0, 2, 3, 6 ] );
            expect( DFplus ).to.have.members( [ 1, 4, 5 ] );
            DFplus = [];
            // dom.alternative_idf( [ 0, 2, 3, 6 ] );
            // expect( DFplus ).to.have.members( [ 1, 4, 5 ] );

        } );

        it( 'should iterate and prune an iterated dominance frontier', () => {

            let DFplus = [];

            dom.forPrunedIteratedDominanceFrontier( dfp => {
                if ( dfp & 1 ) DFplus.push( dfp );
                return dfp & 1;
            }, [ 0, 2, 3, 6 ] );
            expect( DFplus ).to.have.members( [ 1 ] );

        } );

        it( 'should throw an error if it gets bad input', () => {
            expect( make_dom.bind( null, ( 'technically an array of numbers but not this high up' ) ) ).to.throw( Error );
        } );

        it( 'should create a DJ-graph', () => {
            const
                dj      = create_dj_graph( graph ),
                idoms   = iterative( graph ),
                domTree = create_dom_tree( idoms ),
                levels  = create_levels( domTree );

            expect( create_levels( normalize( graph ) ) ).to.eql( [ 0, 1, 2, 3, 4, 5, 6, 3, 4, 5, 2 ] );
            expect( create_levels( [ [ 5 ], [], [ 1 ], [ 2, 4 ], [], [ 3 ] ] ) ).to.eql( [ 0, 4, 3, 2, 3, 1 ] );
            expect( levels ).to.be.an( 'array' );
            expect( levels ).to.eql( [ 0, 1, 2, 3, 3, 3, 4, 3, 4, 5, 2 ] );

            expect( dj.map( n => n[ 0 ] ) ).to.eql( create_dom_tree( idoms ) );
            expect( dj.map( n => n[ 1 ] ) ).to.eql( create_j_edges( graph ) );
            expect( dj.map( n => n[ 1 ] ) ).to.eql( create_j_edges( graph, null, null, idoms ) );
            expect( dj.map( n => n[ 1 ] ) ).to.eql( create_j_edges( graph, null, create_dom_tree( idoms ), idoms ) );
            expect( dj.map( n => n[ 1 ] ) ).to.eql( create_j_edges( graph, levels, create_dom_tree( idoms ), idoms ) );

            expect( create_nodes( graph ) ).to.eql( nodes );
            expect( create_nodes( graph, iterative( graph ) ) ).to.eql( nodes );

            expect( create_dj_graph( graph, idoms, domTree ) ).to.eql( dj );
        } );

        it( 'should make a dom object with various pieces of info', () => {

            let dom = make_dom( { nodes: graph, idoms: iterative( graph ), djGraph: create_dj_graph( graph ) } );

            let DFplus = dom.iteratedDominanceFrontier( [ 0, 2, 3, 6 ] );
            expect( DFplus ).to.have.members( [ 1, 4, 5 ] );


        } );
    } );

} );

