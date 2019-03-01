# BookBuilding

Use [commonmark.js](https://github.com/commonmark/commonmark.js/).

```sh
node BOOKBUILDINGPATH/dest/index.js config.json5
```

```json5
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

// Headress chrome option.
	puppeteer?: puppeteer.LaunchOptions,
	browser?: puppeteer.DirectNavigationOptions,
	pdf?: puppeteer.PDFOptions,
}
```

[puppeteer options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md)
