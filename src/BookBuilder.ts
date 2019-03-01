import * as nfs from 'fs';
const fs = nfs.promises;
import * as path from 'path';
import { Browser, BrowserConfig } from './Browser';

export interface OutputConfig extends BrowserConfig
{
	// Required.
	src: string,
	dest: string,
	url: string, // <file> <dir> <path>

	output?: string,
	debug?: boolean,

	// Hooks.
	afterLoadFileList?: string, // AfterLoadFileListHook
	afterConvertPDF?: string,   // AfterConvertPDFHook
	afterJoinPDF?: string,      // AfterJoinPDFHook
}

export class BookBuilder
{
	private config: OutputConfig;
	private browser: Browser | null;

	constructor( config: OutputConfig )
	{
		this.config = config;
	}

	private debug( ...messages: any[] )
	{
		if ( !this.config.debug ) { return; }
		console.log( ... messages );
	}

	public close()
	{
		if ( !this.browser ) { return Promise.resolve(); }
		return this.browser.close().then( () => { this.browser = null; } );
	}

	public async build()
	{
		// Launch browser.
		this.browser = new Browser( this.config );
		await this.browser.init();

		// Init dir.
		await this.createDir( this.config.dest );

		// Load files. File name [NUM].[EXT]
		const list = this.convertFileList( await this.loadSource() );
		this.debug( 'Load file list:', list );

		// Hook: AfterLoadFileList.
		const files = await this.afterLoadFileList( list );
		this.debug( 'afterLoadFileList:', files );

		// Convert Webpage to PDF.
		await this.convertToPDFs( files );

		// Hook: AfterConvertPDF.
		const pdfs = await this.afterConvertPDF( files );
		this.debug( 'afterConvertPDF:', pdfs );

		// Split PDF. Create 1page pdf.

		// Add page.

		// Merge pdf.

		const pdf = this.config.output || 'output.pdf';

		// Hook: AfterJoinPDF.
		this.afterJoinPDF( pdf );
		this.debug( 'afterJoinPDF:', pdf );

		this.close();
	}

	private async createDir( dir: string )
	{
		const dirs = dir.split( path.sep );
		const d: string[] = [];
		for ( let dir of dirs )
		{
			d.push( dir ); 
			if ( dir === '.' || dir === '..' ) {continue; }
			await this.mkdir( d.join() );
		}
	}

	private mkdir( dir: string )
	{
		return fs.mkdir( dir ).catch( ( error ) =>
		{
			if ( error.code == 'EEXIST' ) { return; }
			throw error;
		} );
	}

	private async loadSource( dir: string = '.' )
	{
		const items = await this.readdir( path.join( this.config.src, dir ) );

		const list = items.files.map( ( item ) => { return path.join( dir, item ); } );
		const dirs = items.dirs.map( ( item ) => { return path.join( dir, item ); } );

		while ( 0 < dirs.length )
		{
			const dir = dirs.shift();
			if ( !dir ) { continue; }
			const files = await this.loadSource( dir );
			list.push( ... files );
		}

		return list;
	}

	private convertFileList( files: string[] )
	{
		const pads: number[] = [];

		files.forEach( ( file ) =>
		{
			const p = file.split( path.sep ).map( ( num ) => { return num.replace( /[^0-9]+/g, '' ); } );
			p.forEach( ( p, index ) =>
			{
				if ( pads[ index ] )
				{
					pads[ index ] = Math.max( pads[ index ], p.length );
				} else { pads[ index ] = p.length; }
			} );
		} );

		return files.map( ( file ) =>
		{
			const nums = file.split( path.sep ).map( ( num, index ) => { return ( parseInt( num ) + '' ).padStart( pads[ index ], '0' ); } );
			return <FileData>{
				file: path.join( this.config.src, file ).split( path.sep ).join( '/' ),
				pdf: path.join( this.config.dest, nums.join( '' ) + '.pdf' ).split( path.sep ).join( '/' ),
			};
		} );
	}

	private async readdir( dir: string )
	{
		const items = await fs.readdir( dir );

		const files: string[] = [];
		const dirs: string[] = [];
		for( let item of items )
		{
			if ( !item.match( /^[0-9]+(\.[^\.]+){0,1}$/ ) ) { continue; }

			const stat = await fs.stat( path.join( dir, item ) );
			if ( stat.isFile() )
			{
				files.push( item );
			} else if ( stat.isDirectory() )
			{
				dirs.push( item );
			}
		}

		return { files: files, dirs: dirs };
	}

	private async convertToPDFs( files: FileData[] )
	{
		for ( let file of files )
		{
			await this.convertToPDF( file );
		}
	}

	private convertToPDF( file: FileData )
	{
		if ( !this.browser ) { return Promise.resolve(); }
		const url = this.createURL( file.file );
		const pdf = file.pdf;
		this.debug( 'pdf:', url, '=>', pdf );
		return this.browser.output( url, pdf, async ( page ) =>
		{
			const data = await fs.readFile( file.file, 'utf8' );
			await page.evaluate( ( data ) =>
			{
				const event = new Event( 'loadfile' );
				(<any>event).data = data;
				document.dispatchEvent( event );
			} , data );
		} );
	}

	private createURL( path: string )
	{
		const parts = path.split( '/' );
		const file = parts.pop() || '';
		const dir = parts.join( '/' );

		return this.config.url.replace( /\<path\>/g, path ).replace( /\<file\>/g, file ).replace( /\<dir\>/g, dir ).replace( /\<.*?\>/g, '' );
	}

	private checkPromise<T>( p: Promise<T> )
	{
		if ( p instanceof Promise || ( p && typeof (<any>p).then === 'function' ) )
		{
			return p;
		}
		return Promise.resolve( p );
	}

	private afterLoadFileList( list: FileData[] )
	{
		if ( !this.config.afterLoadFileList ) { return Promise.resolve( list ); }
		return this.checkPromise( ( LoadHook<AfterLoadFileListHook>( this.config.afterLoadFileList ) )( list ) );
	}

	private afterConvertPDF( list: FileData[] )
	{
		if ( !this.config.afterConvertPDF ) { return Promise.resolve( list ); }
		return this.checkPromise( ( LoadHook<AfterConvertPDFHook>( this.config.afterConvertPDF ) )( list ) );
	}

	private afterJoinPDF( file: string )
	{
		if ( !this.config.afterJoinPDF ) { return Promise.resolve(); }
		return this.checkPromise( ( LoadHook<AfterJoinPDFHook>( this.config.afterJoinPDF ) )( file ) );
	}
}

function LoadHook<T>( file: string )
{
	const script = require( file );
	if ( typeof script !== 'function' ) { throw new Error( 'Cannot function require hook script.' ); }
	return <T>script;
}
