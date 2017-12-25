/** ****************************************************************************************************
 * File: reader (dominators)
 * @author julian on 12/13/17
 * @version 1.0.0
 * @copyright Planet3, Inc.
 *******************************************************************************************************/
'use strict';

const
    argv = require( 'minimist' )( process.argv.slice( 2 ) ),
    offset = argv.r || argv.renumber ? -1 : 0,
    readFile = fname => new Promise( ( res, rej ) => require( 'fs' ).readFile( fname, 'utf8', ( err, data ) => err ? rej( err ) : res( data ) ) ),
    getStdin = require( 'get-stdin' ),
    result   = {
        graph: []
    };

if ( require && require.main === module )
{

    // file2graph( process.argv[ 2 ] ? readFile( process.argv[ 2 ], 'utf8' ) : getStdin() )
    ( argv._.length ? readFile( argv._[ 0 ], 'utf8' ) : getStdin() )
        .then( text2graph )
        .then( result => console.log( JSON.stringify( result, null, 4 ) ) );
}
else
    module.exports = {
        text2graph,
        file2graph
    };

function file2graph( fileName )
{
    if ( typeof fileName !== 'string' && !( fileName instanceof Buffer ) )
        throw new TypeError( `"File name must be a string or buffer, received ${fileName}` );
    return readFile( fileName, 'utf8' ).then( text2graph );
}

function text2graph( src )
{
    const lines = src.split( /[\r\n]+/ ).map( s => s.trim() ).filter( l => !!l );

    let mode  = 'graph',
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
            m = line.match( /^(\d+)(?:([^-\d]+)(.*))?/ );

            if ( m[ 1 ] && m[ 2 ] && !m[ 3 ] )
                result[ mode ][ index = Number( m[ 1 ] ) + offset ] = [];
            else if ( m[ 1 ] && m[ 2 ] && m[ 3 ].trim() === '-' )
                result[ mode ][ index = Number( m[ 1 ] ) + offset ] = null;
            else if ( m[ 1 ] && !m[ 2 ] && !m[ 3 ] )
                result[ mode ][ index++ ] = Number( m[ 1 ] ) + offset;
            else
            {
                const vals = m[ 3 ].split( /[\s,:]+/ ).map( s => s.trim() ).filter( s => !!s ).map( v => v === '-' ? null : Number( v ) + offset );

                result[ mode ][ index = Number( m[ 1 ] ) + offset ] = vals.length === 1 ? vals[ 0 ] : vals;
            }
        }
    }

    Object.entries( result ).forEach( ( [ key, value ] ) => !value.length && delete result[ key ] );

    return result;
}
