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
 * log_function can be provided to use a custom log instead of the log fnc on the module.
 */
export declare function debugFactory(namespace?: string, useColors?: boolean, log_function?: typeof console.log): typeof log;
export declare namespace file {
    /** Readonly */
    let isEnabled: boolean;
    /** Exposed for testing purpose only */
    let missingPartIndicator: Buffer;
    /** Log to file only. Format as console.log.
     *  enable must be called first.
     */
    let log: (message: any, ...optionalParams: any[]) => Promise<void>;
    let terminate: () => Promise<void>;
    function enable(logfile_path: string, max_file_size?: number): void;
}
export declare namespace colors {
    function red(str: string): string;
    function green(str: string): string;
    function yellow(str: string): string;
}
export declare function get_module_dir_path(from_dir_path?: string): string;
