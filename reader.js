/** ****************************************************************************************************
 * File: reader (dominators)
 * @author julian on 12/13/17
 * @version 1.0.0
 * @copyright Planet3, Inc.
 *******************************************************************************************************/
'use strict';

const
    promisify          = require( 'util' ).promisify,
    fs                 = require( 'fs' ),
    readFile           = promisify( fs.readFile ),
    getStdin           = require( 'get-stdin' ),
    { isArray: array } = Array,
    { DFS, BFS }       = require( 'traversals' );

let _read,
    result = {
        graph: []
    };

if ( process.argv[ 2 ] )
    _read = readFile( process.argv[ 2 ], 'utf8' );
else
    _read = getStdin();

_read.then( src => {
    const lines = src.split( /[\r\n]+/ ).map( s => s.trim() ).filter( l => !!l );

    let mode  = 'graph',
        index = 0;

    for ( const line of lines )
    {
        let m = line.match( /^\s*(\w+)\s*:\s*$/ );

        if ( m )
        {
            mode           = m[ 1 ].toLowerCase();
            result[ mode ] = [];
            index          = 0;
        }
        else
        {
            m = line.match( /^(\d+)(?:([^-\d]+)(.*))?/ );

            if ( m[ 1 ] && m[ 2 ] && !m[ 3 ] )
                result[ mode ][ index = Number( m[ 1 ] ) - 1 ] = [];
            else if ( m[ 1 ] && m[ 2 ] && m[ 3 ].trim() === '-' )
                result[ mode ][ index = Number( m[ 1 ] ) - 1 ] = null;
            else if ( m[ 1 ] && !m[ 2 ] && !m[ 3 ] )
                result[ mode ][ index++ ] = Number( m[ 1 ] ) - 1;
            else
            {
                const vals = m[ 3 ].split( /[\s,:]+/ ).map( s => s.trim() ).filter( s => !!s ).map( v => v === '-' ? null : Number( v ) - 1 );

                result[ mode ][ index = Number( m[ 1 ] ) - 1 ] = vals.length === 1 ? vals[ 0 ] : vals;
            }
        }
    }

    Object.entries( result ).forEach( ( [ key, value ] ) => !value.length && delete result[ key ] );

    console.log( JSON.stringify( result, null, 4 ) );
    determine_graph( result.graph );
} );

function determine_graph( nodes )
{
    const
        { levels } = BFS( nodes ),
        index2pre  = [],
        parents    = [],
        edges      = [];

    DFS( nodes, {
        edge( from, to, type )
        {
            if ( type === 'tree' )
                parents[ to ] = from;

            array( edges[ from ] ) || ( edges[ from ] = [] );

            edges[ from ].push( { from, to, type } );
        },
        pre: ( preNum, preOrder ) => index2pre[ preNum ] = preOrder
    } );

    let lanes = [],
        maxLanes = 0,
        perLane = 5,
        allLanes;

    for ( let lvl = 0; ; lvl++ )
    {
        const clvl = nodes.map( ( _, i ) => levels[ i ] === lvl ? i : null ).filter( n => n !== null );
        let lng = clvl.length;

        if ( !lng ) break;
        if ( lng & 1 ) lng++;
        lanes.push( lng );
        if ( lng > maxLanes ) maxLanes = lng;
        console.log( `Level ${lvl} => ${clvl.join( ' ' )}` );
    }

    allLanes = maxLanes * perLane;

    const
        realMax = lanes.reduce( ( prev, b ) => {
            const r = lcm( prev, b );
            console.log( `lcm red: ${prev}, ${b} => ${r}` );
            return r;
        }, 1 ),
        altMax = lanes.reduce( ( prev, b ) => {
            const r = gcd( prev, b );
            console.log( `red: ${prev}, ${b} => ${r}` );
            return r;
        }, 1 );

    console.log( 'lanes:', lanes );
    console.log( 'max:', maxLanes );
    console.log( 'real max:', realMax );
    console.log( 'alt max:', altMax );

    // console.log( nodes.map( ( _, i ) => `${i + 1}: ${levels[ i ] + 1}` ).join( '\n' ) );
}

/*
1 c
2 l r
3 l c r
4 l c c r
5 l c c c r
6 l l c c r r
7 l l c c c r r
8 l l c c c c r r
9 l l l c c c r r r
A l l l c c c c r r r

edges / 3 = number of each connection side
edges % 3 = additional center connections
 */

function blocks2lanes( nodes, pl, total )
{
    const
        groupByParentPre = {},
        finalOrder = [];

    nodes.forEach( n => ( groupByParentPre[ n.parent.pre ] || ( groupByParentPre[ n.parent.pre ] = [] ) ).push( n ) );

    Object.entries( groupByParentPre ).forEach( gpp => gpp.sort( ( a, b ) => a.pre - b.pre ) );

    Object.keys( groupByParentPre ).map( n => Number( n ) ).sort().forEach( gpp => finalOrder.push( ...groupByParentPre[ gpp ] ) );

}



function gcd( a, b )
{
    if ( !b ) return a;

    let rem = 0;
    do {
        rem = a % b;
        a = b;
        b = rem;
    } while ( b );

    return a;
}

function lcm( a, b )
{
    if ( !a || !b ) return 0;

    return a * b / gcd( a, b );
}