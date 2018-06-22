import * as util from "util";
import * as scriptLib from "scripting-tools";
import * as debug_from_nmp from "debug";
import * as path from "path";
import * as fs from "fs";
import * as runExclusive from "run-exclusive";

let isStdoutDisabled = false;

/** 
 * To disable logging on stdout, should be enabled in production.
 * Log and debug will only write to the logfile.
 * */
export function disableStdout(){
    isStdoutDisabled= true;
}

/** 
 * Log to stdout and to file, format input as console.log
 * If disableStdout have been called nothing will be log to the console.
 * If file.enable have NOT been called nothing will be log to file.
 * */
export const log: (message: any, ...optionalParams: any[]) => Promise<void> =
    (...any) => {

        if (!isStdoutDisabled) {
            console.log.apply(console, any);
        }

        if (file.isEnabled) {
            return file.log.apply(null, any);
        } else {
            return Promise.resolve();
        }

    };

/** 
 * Provide a method to petty print on stdout and to file is enabled.
 * If namespace is not specified one will be computed based on the caller file name.
 * e.g. "lib/foobar.js"
 */
export function debugFactory(namespace?: string): typeof log {

    if (namespace === undefined) {

        const caller_file_path = get_caller_file_path();

        const module_dir_path = get_module_dir_path(path.dirname(caller_file_path));

        namespace = path.relative(module_dir_path, caller_file_path).replace(/^dist\//, "");

    }

    const debug = debug_from_nmp(namespace);

    debug.enabled = true;

    return (...args) => new Promise(
        (resolve, reject) => {

            debug.log = (...args) => log.apply(null, args)
                .then(() => resolve())
                .catch(error => reject(error));

            debug.apply(null, args);

        }
    );
}

export namespace file {

    /** Readonly */
    export let isEnabled = false;

    /** Exposed for testing purpose only */
    export let missingPartIndicator = Buffer.from([
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

    let current_logfile_size: number;
    let reduce_from: number;
    let reduce_to: number;

    /** Log to file only. Format as console.log.
     *  enable must be called first.
     */
    export let log: (message: any, ...optionalParams: any[]) => Promise<void> = () => {
        throw new Error("File logging is not enabled");
    };

    export let terminate= (): Promise<void>=> {
        throw new Error("File logging is not enabled");
    }

    export function enable(
        logfile_path: string,
        max_file_size = 500000
    ) {

        scriptLib.execSync(`rm -f ${logfile_path}`);

        current_logfile_size = 0;
        reduce_from = NaN;
        reduce_to = NaN;

        let buffer_cache: Buffer = new Buffer(0);

        const _log= runExclusive.build(async ()=> {

            const buffer= buffer_cache;

            buffer_cache= new Buffer(0);

            await util.promisify(fs.appendFile)(logfile_path, buffer);

            current_logfile_size += buffer.length;

            if (isNaN(reduce_from)) {

                if (current_logfile_size >= max_file_size / 4) {

                    reduce_from = current_logfile_size;

                }

            } else if (isNaN(reduce_to)) {

                if (current_logfile_size >= Math.floor((3 / 4) * max_file_size)) {

                    reduce_to = current_logfile_size - 1;

                }

            } else {

                if (current_logfile_size >= max_file_size) {

                    current_logfile_size = await reduceFile(
                        logfile_path, current_logfile_size, reduce_from, reduce_to, missingPartIndicator
                    );

                    reduce_to = NaN;

                }

            }

        });

        log = async (...args) => {

            if( !isEnabled ){
                return new Promise<void>(resolve=>{});
            }

            buffer_cache = Buffer.concat([
                buffer_cache,
                Buffer.from(util.format.apply(util.format, args) + "\n", "utf8")
            ]);

            if( runExclusive.isRunning(_log) ){

                if( runExclusive.getQueuedCallCount(_log) === 0 ){
                    return _log();
                }else{
                    return runExclusive.getPrComplete(_log);
                }

            }else{

                return _log();

            }

        };

        terminate= ()=> {

            isEnabled= false;

            return runExclusive.getPrComplete(_log);

        }

        isEnabled = true;

    }

    async function reduceFile(
        file_path: string,
        file_size: number,
        from: number,
        to: number,
        replaceTruncatedChunkBy: Buffer
    ): Promise<number> {

        const new_file_size = file_size - 1 - (to - from) + replaceTruncatedChunkBy.length;

        const fd = await util.promisify(fs.open)(file_path, "r")

        const buffer = Buffer.alloc(new_file_size);

        await util.promisify(fs.read)(fd, buffer, 0, from, 0);

        buffer.write(replaceTruncatedChunkBy.toString("hex"), from, replaceTruncatedChunkBy.length, "hex");

        await util.promisify(fs.read)(fd, buffer, from + replaceTruncatedChunkBy.length, file_size - 1 - to, to + 1);

        await util.promisify(fs.close)(fd);

        await util.promisify(fs.writeFile)(file_path, buffer);

        return new_file_size;

    }

}

export namespace colors {

    export function red(str: string): string {
        return scriptLib.colorize(str, "RED");
    }

    export function green(str: string): string {
        return scriptLib.colorize(str, "GREEN");
    }

    export function yellow(str: string): string {
        return scriptLib.colorize(str, "YELLOW");
    }

}


/** Get path of the file that called the function that is evaluating this. */
export function get_caller_file_path(): string {

    let originalFunc = Error.prepareStackTrace;

    let callerFile;

    try {
        let err: any = new Error();
        let currentFile;

        Error.prepareStackTrace = function (err, stack) { return stack; };

        currentFile = err.stack!.shift().getFileName();

        while (err.stack.length) {
            callerFile = err.stack.shift().getFileName();

            if (currentFile !== callerFile) break;
        }
    } catch (e) { }

    Error.prepareStackTrace = originalFunc;

    return callerFile;

}

export function get_module_dir_path(from_dir_path?: string): string {

    if (from_dir_path === undefined) {
        from_dir_path = path.dirname(get_module_dir_path());
    }

    if (!!scriptLib.fs_ls(from_dir_path).find(file_name => file_name === "package.json")) {

        return from_dir_path;

    } else {

        const parent_dir_path = path.join(from_dir_path, "..");

        if (parent_dir_path === from_dir_path) {
            throw new Error("No package.json found");
        }

        return get_module_dir_path(parent_dir_path);

    }

}
