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
const JSON5 = require("json5");
const BookBuilder_1 = require("./BookBuilder");
function GetConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.argv.length < 2) {
            throw new Error('No config.');
        }
        const data = yield fs.readFile(process.argv[2], 'utf8');
        const config = JSON5.parse(data);
        if (typeof config.src !== 'string') {
            throw new Error('Config.src is invalid.');
        }
        if (typeof config.dest !== 'string') {
            throw new Error('Config.dest is invalid.');
        }
        config.src = path.normalize(config.src);
        config.dest = path.normalize(config.dest);
        if (typeof config.url !== 'string' || !config.url) {
            config.url = path.resolve(__dirname, '../template/index.html');
        }
        if (typeof config.output !== 'string' || !config.output) {
            config.output = path.join(config.dest, 'output.pdf');
        }
        if (typeof config.puppeteer !== 'object') {
            config.puppeteer = {};
        }
        if (typeof config.browser !== 'object') {
            config.browser = {};
        }
        if (typeof config.afterLoadFileList !== 'string') {
            config.afterLoadFileList = '';
        }
        if (typeof config.afterConvertPDF !== 'string') {
            config.afterConvertPDF = '';
        }
        if (typeof config.afterJoinPDF !== 'string') {
            config.afterJoinPDF = '';
        }
        return config;
    });
}
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield GetConfig();
        const bb = new BookBuilder_1.BookBuilder(config);
        yield bb.build();
    });
}
Main().then(() => {
    console.log('Complete');
}).catch((error) => { console.error(error); });
