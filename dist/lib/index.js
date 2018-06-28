"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("util");
var scriptLib = require("scripting-tools");
var debug_from_nmp = require("debug");
var path = require("path");
var fs = require("fs");
var runExclusive = require("run-exclusive");
var isStdoutDisabled = false;
/**
 * To disable logging on stdout, should be enabled in production.
 * Log and debug will only write to the logfile.
 * */
function disableStdout() {
    isStdoutDisabled = true;
}
exports.disableStdout = disableStdout;
/**
 * Log to stdout and to file, format input as console.log
 * If disableStdout have been called nothing will be log to the console.
 * If file.enable have NOT been called nothing will be log to file.
 * */
exports.log = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i] = arguments[_i];
    }
    if (!isStdoutDisabled) {
        console.log.apply(console, any);
    }
    if (file.isEnabled) {
        return file.log.apply(null, any);
    }
    else {
        return Promise.resolve();
    }
};
/**
 * Provide a method to petty print on stdout and to file is enabled.
 * If namespace is not specified one will be computed based on the caller file name.
 * e.g. "lib/foobar.js"
 * log_function can be provided to use a custom log instead of the log fnc on the module.
 */
function debugFactory(namespace, useColors, log_function) {
    if (useColors === void 0) { useColors = true; }
    if (namespace === undefined) {
        var caller_file_path = scriptLib.get_caller_file_path();
        var module_dir_path = get_module_dir_path(path.dirname(caller_file_path));
        namespace = path.relative(module_dir_path, caller_file_path).replace(/^dist\//, "");
    }
    debug_from_nmp["useColors"] = function () { return useColors; };
    var debug = debug_from_nmp(namespace);
    debug.enabled = true;
    if (!!log_function) {
        debug.log = log_function;
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            if (!log_function) {
                debug.log = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return exports.log.apply(null, args)
                        .then(function () { return resolve(); })
                        .catch(function (error) { return reject(error); });
                };
            }
            else {
                resolve();
            }
            debug.apply(null, args);
        });
    };
}
exports.debugFactory = debugFactory;
var file;
(function (file) {
    /** Readonly */
    file.isEnabled = false;
    /** Exposed for testing purpose only */
    file.missingPartIndicator = Buffer.from([
        "",
        "",
        "",
        "==========================================",
        "================TRUNCATED=================",
        "==========================================",
        "",
        "",
        "",
        ""
    ].join("\n"), "utf8");
    var current_logfile_size;
    var reduce_from;
    var reduce_to;
    /** Log to file only. Format as console.log.
     *  enable must be called first.
     */
    file.log = function () {
        throw new Error("File logging is not enabled");
    };
    file.terminate = function () {
        throw new Error("File logging is not enabled");
    };
    function enable(logfile_path, max_file_size) {
        var _this = this;
        if (max_file_size === void 0) { max_file_size = 500000; }
        scriptLib.execSync("rm -f " + logfile_path);
        current_logfile_size = 0;
        reduce_from = NaN;
        reduce_to = NaN;
        var buffer_cache = new Buffer(0);
        var _log = runExclusive.build(function () { return __awaiter(_this, void 0, void 0, function () {
            var buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buffer = buffer_cache;
                        buffer_cache = new Buffer(0);
                        return [4 /*yield*/, util.promisify(fs.appendFile)(logfile_path, buffer)];
                    case 1:
                        _a.sent();
                        current_logfile_size += buffer.length;
                        if (!isNaN(reduce_from)) return [3 /*break*/, 2];
                        if (current_logfile_size >= max_file_size / 4) {
                            reduce_from = current_logfile_size;
                        }
                        return [3 /*break*/, 5];
                    case 2:
                        if (!isNaN(reduce_to)) return [3 /*break*/, 3];
                        if (current_logfile_size >= Math.floor((3 / 4) * max_file_size)) {
                            reduce_to = current_logfile_size - 1;
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        if (!(current_logfile_size >= max_file_size)) return [3 /*break*/, 5];
                        return [4 /*yield*/, reduceFile(logfile_path, current_logfile_size, reduce_from, reduce_to, file.missingPartIndicator)];
                    case 4:
                        current_logfile_size = _a.sent();
                        reduce_to = NaN;
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        }); });
        file.log = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!file.isEnabled) {
                        return [2 /*return*/, Promise.resolve()];
                    }
                    buffer_cache = Buffer.concat([
                        buffer_cache,
                        Buffer.from(util.format.apply(util.format, args) + "\n", "utf8")
                    ]);
                    if (runExclusive.isRunning(_log)) {
                        if (runExclusive.getQueuedCallCount(_log) === 0) {
                            return [2 /*return*/, _log()];
                        }
                        else {
                            return [2 /*return*/, runExclusive.getPrComplete(_log)];
                        }
                    }
                    else {
                        return [2 /*return*/, _log()];
                    }
                    return [2 /*return*/];
                });
            });
        };
        file.terminate = function () {
            file.isEnabled = false;
            return runExclusive.getPrComplete(_log);
        };
        file.isEnabled = true;
    }
    file.enable = enable;
    function reduceFile(file_path, file_size, from, to, replaceTruncatedChunkBy) {
        return __awaiter(this, void 0, void 0, function () {
            var new_file_size, fd, buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        new_file_size = file_size - 1 - (to - from) + replaceTruncatedChunkBy.length;
                        return [4 /*yield*/, util.promisify(fs.open)(file_path, "r")];
                    case 1:
                        fd = _a.sent();
                        buffer = Buffer.alloc(new_file_size);
                        return [4 /*yield*/, util.promisify(fs.read)(fd, buffer, 0, from, 0)];
                    case 2:
                        _a.sent();
                        buffer.write(replaceTruncatedChunkBy.toString("hex"), from, replaceTruncatedChunkBy.length, "hex");
                        return [4 /*yield*/, util.promisify(fs.read)(fd, buffer, from + replaceTruncatedChunkBy.length, file_size - 1 - to, to + 1)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, util.promisify(fs.close)(fd)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, util.promisify(fs.writeFile)(file_path, buffer)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, new_file_size];
                }
            });
        });
    }
})(file = exports.file || (exports.file = {}));
var colors;
(function (colors) {
    function red(str) {
        return scriptLib.colorize(str, "RED");
    }
    colors.red = red;
    function green(str) {
        return scriptLib.colorize(str, "GREEN");
    }
    colors.green = green;
    function yellow(str) {
        return scriptLib.colorize(str, "YELLOW");
    }
    colors.yellow = yellow;
})(colors = exports.colors || (exports.colors = {}));
function get_module_dir_path(from_dir_path) {
    if (from_dir_path === undefined) {
        from_dir_path = path.dirname(get_module_dir_path());
    }
    if (!!scriptLib.fs_ls(from_dir_path).find(function (file_name) { return file_name === "package.json"; })) {
        return from_dir_path;
    }
    else {
        var parent_dir_path = path.join(from_dir_path, "..");
        if (parent_dir_path === from_dir_path) {
            throw new Error("No package.json found");
        }
        return get_module_dir_path(parent_dir_path);
    }
}
exports.get_module_dir_path = get_module_dir_path;
