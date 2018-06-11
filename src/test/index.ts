
import * as logger from "../lib";
import * as scriptLib from "scripting-tools";
import * as fs from "fs";

process.once("unhandledRejection", error => {

    throw error;

});

(async () => {

    const logfile_path = "/tmp/test_logger.log";

    await (async ()=> {

        const max_size= 10000;

        logger.file.enable(logfile_path, max_size);

        logger.disableStdout();

        const debug= logger.debugFactory();

        for( let i = 0; i<6000; i++ ){

            debug(`è¤~~=><${i}><=~~éç`);
            
        }


        await debug("last message");

        console.log(fs.readFileSync(logfile_path).toString("utf8"));

        console.assert(fs.statSync(logfile_path).size < max_size + 30);

    })();

    await (async () => {

        logger.file.enable(logfile_path, 8);

        logger.file.missingPartIndicator = Buffer.alloc(0);

        await logger.file.log("A");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\n");

        await logger.file.log("B");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\nB\n");

        await logger.file.log("C");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\nB\nC\n");

        await logger.file.log("D");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\nD\n");

        await logger.file.log("E");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\nD\nE\n");

        await logger.file.log("F");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\nF\n");

        scriptLib.execSync(`rm ${logfile_path}`);

        console.log(logger.colors.green("PASS 1"));

    })();

    await (async () => {

        logger.file.enable(logfile_path, 8);

        logger.file.missingPartIndicator = Buffer.from("-", "utf8");

        await logger.file.log("A");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\n");

        await logger.file.log("B");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\nB\n");

        await logger.file.log("C");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\nB\nC\n");

        await logger.file.log("D");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\n-D\n");

        await logger.file.log("E");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\n-D\nE\n");

        await logger.file.log("F");

        console.assert(fs.readFileSync(logfile_path).toString("utf8") === "A\n-F\n");

        scriptLib.execSync(`rm ${logfile_path}`);

        console.log(logger.colors.green("PASS 2"));

    })();


})();

