
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logFile = path.join(__dirname, 'debug_output.txt');
fs.writeFileSync(logFile, "Starting debug...\n");

function log(msg) {
    fs.appendFileSync(logFile, msg + "\n");
    console.log(msg);
}

function safeRequire(name, modPath) {
    try {
        log(`[Loading] ${name}...`);
        const mod = require(modPath);
        log(`[Success] ${name} loaded. Keys: ` + (mod ? Object.keys(mod).join(', ') : 'null'));
        return mod;
    } catch (e) {
        log(`[FAILURE] Failed to load ${name}:`);
        log(e.message);
        log(e.stack);
        process.exit(1);
    }
}

try {
    log(`GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}`);

    safeRequire('gemini.service', './services/gemini.service');
    safeRequire('Syllabus', './models/Syllabus');
    safeRequire('Assignment', './models/Assignment');
    safeRequire('faculty.controller', './controllers/faculty.controller');
    safeRequire('faculty.routes', './routes/faculty.routes');

    log("All modules loaded successfully.");
} catch (err) {
    log("Global Error: " + err.message);
}
