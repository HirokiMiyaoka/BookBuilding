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
const path = require("path");
const Browser_1 = require("./Browser");
class BookBuilder {
    constructor(config) {
        this.config = config;
    }
    debug(...messages) {
        if (!this.config.debug) {
            return;
        }
        console.log(...messages);
    }
    close() {
        if (!this.browser) {
            return Promise.resolve();
        }
        return this.browser.close().then(() => { this.browser = null; });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = new Browser_1.Browser(this.config);
            yield this.browser.init();
            yield this.createDir(this.config.dest);
            const list = this.convertFileList(yield this.loadSource());
            this.debug('Load file list:', list);
            const files = yield this.afterLoadFileList(list);
            this.debug('afterLoadFileList:', files);
            yield this.convertToPDFs(files);
            const pdfs = yield this.afterConvertPDF(files);
            this.debug('afterConvertPDF:', pdfs);
            const pdf = this.config.output || 'output.pdf';
            this.afterJoinPDF(pdf);
            this.debug('afterJoinPDF:', pdf);
            this.close();
        });
    }
    createDir(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            const dirs = dir.split(path.sep);
            const d = [];
            for (let dir of dirs) {
                d.push(dir);
                if (dir === '.' || dir === '..') {
                    continue;
                }
                yield this.mkdir(d.join());
            }
        });
    }
    mkdir(dir) {
        return fs.mkdir(dir).catch((error) => {
            if (error.code == 'EEXIST') {
                return;
            }
            throw error;
        });
    }
    loadSource(dir = '.') {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield this.readdir(path.join(this.config.src, dir));
            const list = items.files.map((item) => { return path.join(dir, item); });
            const dirs = items.dirs.map((item) => { return path.join(dir, item); });
            while (0 < dirs.length) {
                const dir = dirs.shift();
                if (!dir) {
                    continue;
                }
                const files = yield this.loadSource(dir);
                list.push(...files);
            }
            return list;
        });
    }
    convertFileList(files) {
        const pads = [];
        files.forEach((file) => {
            const p = file.split(path.sep).map((num) => { return num.replace(/[^0-9]+/g, ''); });
            p.forEach((p, index) => {
                if (pads[index]) {
                    pads[index] = Math.max(pads[index], p.length);
                }
                else {
                    pads[index] = p.length;
                }
            });
        });
        return files.map((file) => {
            const nums = file.split(path.sep).map((num, index) => { return (parseInt(num) + '').padStart(pads[index], '0'); });
            return {
                file: path.join(this.config.src, file).split(path.sep).join('/'),
                pdf: path.join(this.config.dest, nums.join('') + '.pdf').split(path.sep).join('/'),
            };
        });
    }
    readdir(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield fs.readdir(dir);
            const files = [];
            const dirs = [];
            for (let item of items) {
                if (!item.match(/^[0-9]+(\.[^\.]+){0,1}$/)) {
                    continue;
                }
                const stat = yield fs.stat(path.join(dir, item));
                if (stat.isFile()) {
                    files.push(item);
                }
                else if (stat.isDirectory()) {
                    dirs.push(item);
                }
            }
            return { files: files, dirs: dirs };
        });
    }
    convertToPDFs(files) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let file of files) {
                yield this.convertToPDF(file);
            }
        });
    }
    convertToPDF(file) {
        if (!this.browser) {
            return Promise.resolve();
        }
        const url = this.createURL(file.file);
        const pdf = file.pdf;
        this.debug('pdf:', url, '=>', pdf);
        return this.browser.output(url, pdf, (page) => __awaiter(this, void 0, void 0, function* () {
            const data = yield fs.readFile(file.file, 'utf8');
            yield page.evaluate((data) => {
                const event = new Event('loadfile');
                event.data = data;
                document.dispatchEvent(event);
            }, data);
        }));
    }
    createURL(path) {
        const parts = path.split('/');
        const file = parts.pop() || '';
        const dir = parts.join('/');
        return this.config.url.replace(/\<path\>/g, path).replace(/\<file\>/g, file).replace(/\<dir\>/g, dir).replace(/\<.*?\>/g, '');
    }
    checkPromise(p) {
        if (p instanceof Promise || (p && typeof p.then === 'function')) {
            return p;
        }
        return Promise.resolve(p);
    }
    afterLoadFileList(list) {
        if (!this.config.afterLoadFileList) {
            return Promise.resolve(list);
        }
        return this.checkPromise((LoadHook(this.config.afterLoadFileList))(list));
    }
    afterConvertPDF(list) {
        if (!this.config.afterConvertPDF) {
            return Promise.resolve(list);
        }
        return this.checkPromise((LoadHook(this.config.afterConvertPDF))(list));
    }
    afterJoinPDF(file) {
        if (!this.config.afterJoinPDF) {
            return Promise.resolve();
        }
        return this.checkPromise((LoadHook(this.config.afterJoinPDF))(file));
    }
}
exports.BookBuilder = BookBuilder;
function LoadHook(file) {
    const script = require(file);
    if (typeof script !== 'function') {
        throw new Error('Cannot function require hook script.');
    }
    return script;
}
