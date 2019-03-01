import * as nfs from 'fs';
const fs = nfs.promises;
import * as path from 'path';
import * as JSON5 from 'json5';

import { BookBuilder, OutputConfig } from './BookBuilder';

async function GetConfig(): Promise<OutputConfig>
{
	if ( process.argv.length < 2 ) { throw new Error( 'No config.' ); }
	const data = await fs.readFile( process.argv[ 2 ], 'utf8' );
	const config: OutputConfig = JSON5.parse( data );

	// Config check.
	if ( typeof config.src !== 'string' ) { throw new Error( 'Config.src is invalid.' ); }
	if ( typeof config.dest !== 'string' ) { throw new Error( 'Config.dest is invalid.' ); }
	///if ( typeof option.url !== 'string' ) { throw new Error( 'Config.url is invalid.' ); }
	config.src = path.normalize( config.src );
	config.dest = path.normalize( config.dest );
	if ( typeof config.url !== 'string' || !config.url ) { config.url = path.resolve( __dirname, '../template/index.html' ); }

	if ( typeof config.output !== 'string' || !config.output ) { config.output = path.join( config.dest, 'output.pdf' ); }

	if ( typeof config.afterLoadFileList !== 'string' ) { config.afterLoadFileList = ''; }
	if ( typeof config.afterConvertPDF !== 'string' ) { config.afterConvertPDF = ''; }
	if ( typeof config.afterJoinPDF !== 'string' ) { config.afterJoinPDF = ''; }

	if ( typeof config.puppeteer !== 'object' ) { config.puppeteer = {}; }
	if ( typeof config.browser !== 'object' ) { config.browser = {}; }
	if ( typeof config.pdf !== 'object' ) { config.pdf = {}; }

	return config;
}

async function Main()
{
	const config = await GetConfig();

	const bb = new BookBuilder( config );

	await bb.build();

}

Main().then( () =>
{
	console.log( 'Complete' );
} ).catch( ( error ) => { console.error( error ); } );
