/** ****************************************************************************************************
 * File: reader (dominators)
 * @author julian on 12/13/17
 * @version 1.0.0
 * @copyright Planet3, Inc.
 *******************************************************************************************************/
'use strict';

const
    promisify = require( 'util' ).promisify,
    fs = require( 'fs' ),
    readFile = promisify( fs.readFile ),
    getStdin = require( 'get-stdin' );

let _read,
    result = {
        graph: []
    };

if ( process.argv[ 2 ] )
{
    _read = readFile( process.argv[ 2 ], 'utf8' );
}
else
{
    _read = getStdin();
}

_read.then( src => {
    const lines = src.split( /[\r\n]+/ ).map( s => s.trim() ).filter( l => !!l );

    let mode = 'graph',
        index = 0;

    for ( const line of lines )
    {
        let m = line.match( /^\s*(\w+)\s*:\s*$/ );

        if ( m )
        {
            mode = m[ 1 ].toLowerCase();
            result[ mode ] = [];
            index = 0;
        }
        else
        {
            if ( index === 11 )
                debugger;
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

    Object.entries( result ).forEach( ( [ key, value ] ) => {
        if ( !value.length ) delete result[ key ];
    } );

    console.log( JSON.stringify( result, null, 4 ) );
} );

