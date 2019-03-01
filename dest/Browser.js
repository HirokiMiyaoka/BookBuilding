"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nfs = require("fs");
const fs = nfs.promises;
const puppeteer = require("puppeteer");
class Browser {
    constructor(config) {
        this.config = config;
    }
    init() {
        return puppeteer.launch(this.config.puppeteer).then((browser) => {
            this.browser = browser;
            return browser;
        });
    }
    close() {
        if (!this.browser) {
            return Promise.resolve();
        }
        return this.browser.close();
    }
    load(url, exec) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = yield this.browser.newPage();
            const response = yield page.goto(url, this.config.browser);
            if (exec) {
                yield exec(page);
            }
            return { page: page, response: response };
        });
    }
    convertPDF(url, exec) {
        return this.load(url, exec).then((result) => {
            return result.page.pdf().then((buffer) => {
                return Object.assign({ buffer: buffer }, result);
            });
        });
    }
    output(url, pdf, exec) {
        return this.convertPDF(url, exec).then((result) => {
            return fs.writeFile(pdf, result.buffer).then(() => {
                return result.page.close();
            });
        });
    }
}
exports.Browser = Browser;
