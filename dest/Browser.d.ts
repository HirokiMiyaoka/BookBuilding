import * as puppeteer from 'puppeteer';
export interface BrowserConfig {
    puppeteer?: puppeteer.LaunchOptions;
    browser?: puppeteer.DirectNavigationOptions;
}
export declare class Browser {
    private config;
    private browser;
    constructor(config: BrowserConfig);
    init(): Promise<puppeteer.Browser>;
    close(): Promise<void>;
    load(url: string, exec?: (page: puppeteer.Page) => Promise<void>): Promise<{
        page: puppeteer.Page;
        response: puppeteer.Response | null;
    }>;
    convertPDF(url: string, exec?: (page: puppeteer.Page) => Promise<void>): Promise<{
        buffer: Buffer;
    } & {
        page: puppeteer.Page;
        response: puppeteer.Response | null;
    }>;
    output(url: string, pdf: string, exec?: (page: puppeteer.Page) => Promise<void>): Promise<void>;
}
