import * as nfs from 'fs';
const fs = nfs.promises;
import * as puppeteer from 'puppeteer';

export interface BrowserConfig
{
	// Headress chrome option.
	puppeteer?: puppeteer.LaunchOptions,
	browser?: puppeteer.DirectNavigationOptions,
	pdf?: puppeteer.PDFOptions,
}

export class Browser
{
	private config: BrowserConfig;
	private browser: puppeteer.Browser;

	constructor( config: BrowserConfig )
	{
		this.config = config;
	}

	public init()
	{
		return puppeteer.launch( this.config.puppeteer ).then( ( browser ) =>
		{
			this.browser = browser;
			return browser;
		} );
	}

	public close()
	{
		if ( !this.browser ) { return Promise.resolve(); }
		return this.browser.close();
	}

	public async load( url: string, exec?: ( page: puppeteer.Page ) => Promise<void> )
	{
		const page = await this.browser.newPage();
		const response = await page.goto( url, this.config.browser );//{ waitUntil: [ 'load', 'domcontentloaded' ] }
		if ( exec ) { await exec( page ); }
		return { page: page, response: response };
	}

	public convertPDF( url: string, exec?: ( page: puppeteer.Page ) => Promise<void> )
	{
		return this.load( url, exec ).then( ( result ) =>
		{
			return result.page.pdf().then( ( buffer ) =>
			{
				return Object.assign( { buffer: buffer }, result );
			} );
		} );
	}

	public output( url: string, pdf: string, exec?: ( page: puppeteer.Page ) => Promise<void> )
	{
		return this.convertPDF( url, exec ).then( ( result ) =>
		{
			return fs.writeFile( pdf, result.buffer ).then( () =>
			{
				return result.page.close();
			} );
		} );
	}
}