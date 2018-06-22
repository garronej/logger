
import * as logger from "../lib/index";

    const logfile_path = "/tmp/test_logger.log";

logger.file.enable(logfile_path, 5000000);

logger.disableStdout();

const debug= logger.debugFactory();

(async ()=> {

    while( true ){

        debug((new Array(7)).fill(Date.now()).join("_"));
        debug((new Array(7)).fill(Date.now()).join("*"));

        await new Promise(resolve=> setTimeout(resolve, 0));

    }

})();

(async () => {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        (function print_mem() {
            const used = process.memoryUsage();
            for (let key in used) {
                console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
            }
        })();
    }
})();