//// <reference path="../node_modules/@types/puppeteer/index.d.ts" />
//import { LaunchOptions, DirectNavigationOptions } from '../node_modules/@types/puppeteer';


interface FileData { file: string, pdf: string }
interface AfterLoadFileListHook { ( files: FileData[] ): Promise<FileData[]> }
interface AfterConvertPDFHook { ( files: FileData[] ): Promise<FileData[]> }
interface AfterJoinPDFHook { ( file: string ): Promise<void> }
