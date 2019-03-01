import { BrowserConfig } from './Browser';
export interface OutputConfig extends BrowserConfig {
    src: string;
    dest: string;
    url: string;
    output?: string;
    debug?: boolean;
    afterLoadFileList?: string;
    afterConvertPDF?: string;
    afterJoinPDF?: string;
}
export declare class BookBuilder {
    private config;
    private browser;
    constructor(config: OutputConfig);
    private debug;
    close(): Promise<void>;
    build(): Promise<void>;
    private createDir;
    private mkdir;
    private loadSource;
    private convertFileList;
    private readdir;
    private convertToPDFs;
    private convertToPDF;
    private createURL;
    private checkPromise;
    private afterLoadFileList;
    private afterConvertPDF;
    private afterJoinPDF;
}
