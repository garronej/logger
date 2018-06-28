import { createService } from "scripting-tools";

createService({
    "rootProcess": async () => {

        const path = await import("path");
        const child_process = await import("child_process");
        const logger = await import("../lib");

        return {
            "pidfile_path": path.join(__dirname, "pid"),
            "assert_unix_user": "root",
            "isQuiet": false,
            "doForwardDaemonStdout": true,
            "daemon_unix_user": "pi",
            "daemon_count": 4,
            "preForkTask": async (terminateSubProcesses, daemon_number) => {

                const debug = logger.debugFactory(`Root process pre fork ${daemon_number}`);

                if( daemon_number !== 1 ){

                    debug(`We do the preFork task only for daemon process 1 and not for ${daemon_number}`);

                    return;

                }

                while (true) {

                    const isSuccess = await new Promise<boolean>(resolve => {

                        debug("preFork subprocess...");

                        const childProcess = child_process.exec("sleep 0.2 && (($RANDOM%2))", { "shell": "/bin/bash" });

                        childProcess.once("error", () => resolve(false))
                            .once("close", code => (code === 0) ? resolve(true) : resolve(false))
                            ;

                        terminateSubProcesses.impl = () => new Promise(resolve_ => {

                            resolve = () => {

                                debug("preFork subprocess killed");

                                resolve_();

                            };

                            debug("kill preFork");

                            childProcess.kill("SIGKILL");

                        });

                    });

                    if (isSuccess) {

                        debug("preFork tasks complete");

                        break;

                    } else {

                        debug("not yet");

                    }

                }


            }
        };

    },
    "daemonProcess": async (daemon_number, daemon_count) => {

        const os = await import("os");
        const logger = await import("../lib");
        const scriptLib = await import("scripting-tools");
        const fs= await import("fs");
        const path = await import("path");

        const logfile_path = `${__dirname}/p${daemon_number}.log`;

        const debug = logger.debugFactory(undefined, true);

        console.log(`${daemon_number}/${daemon_count} started`);

        if( daemon_number !== 1 ){
            logger.disableStdout();
        }

        logger.file.enable(logfile_path);

        return {
            "launch": async () => {

                let count = 10000;

                while (count--) {

                    debug("Grinding hard...", {
                        "pid": process.pid,
                        "user": os.userInfo().username,
                        "cwd": process.cwd()
                    });

                    await new Promise(resolve=> setTimeout(resolve, 1000));

                }


            },
            "beforeExitTask": async error => {

                debug("Performing phony async cleanup task...");

                await new Promise(resolve => setTimeout(resolve, 500));

                if( !!error ){

                    debug("Exiting because of an error", error);

                }

                await logger.file.terminate();

                if (error) {

                    scriptLib.execSync(`mv ${logfile_path} ${path.join(path.dirname(logfile_path), `crash_report_p${daemon_number}.log`)}`);

                }else{

                    fs.unlinkSync(logfile_path); 

                }


            }
        };

    }
});
