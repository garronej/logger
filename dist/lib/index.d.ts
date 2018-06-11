/// <reference types="node" />
/**
 * To disable logging on stdout, should be enabled in production.
 * Log and debug will only write to the logfile.
 * */
export declare function disableStdout(): void;
/**
 * Log to stdout and to file, format input as console.log
 * If disableStdout have been called nothing will be log to the console.
 * If file.enable have NOT been called nothing will be log to file.
 * */
export declare const log: (message: any, ...optionalParams: any[]) => Promise<void>;
/**
 * Provide a method to petty print on stdout and to file is enabled.
 * If namespace is not specified one will be computed based on the caller file name.
 * e.g. "lib/foobar.js"
 */
export declare function debugFactory(namespace?: string): typeof log;
export declare namespace file {
    /** Readonly */
    let isEnabled: boolean;
    /** Exposed for testing purpose only */
    let missingPartIndicator: Buffer;
    /** Log to file only. Format as console.log.
     *  enable must be called first.
     */
    let log: (message: any, ...optionalParams: any[]) => Promise<void>;
    function enable(logfile_path: string, max_file_size?: number): void;
}
export declare namespace colors {
    function red(str: string): string;
    function green(str: string): string;
    function yellow(str: string): string;
}
/** Get path of the file that called the function that is evaluating this. */
export declare function get_caller_file_path(): string;
export declare function get_module_dir_path(from_dir_path?: string): string;
