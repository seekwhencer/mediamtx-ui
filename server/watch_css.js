import { resolve } from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const folderPath = resolve('./public/css');
const DEBOUNCE_MS = 100;
const wss = new WebSocketServer({ port: 35729 });

console.log(`Watching folder: ${folderPath}`);

const timers = new Map();
const watchers = new Map();

function watchFile(filePath) {
    if (!filePath.endsWith('.css')) return;
    if (watchers.has(filePath)) return;

    const watcher = fs.watch(filePath, { persistent: true }, (eventType) => {
        if (eventType !== 'change') return;

        if (timers.has(filePath)) clearTimeout(timers.get(filePath));

        timers.set(filePath, setTimeout(() => {
            console.log(`CSS changed: ${filePath}`);
            for (const client of wss.clients) {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ type: 'reload-css', file: filePath }));
                }
            }
            timers.delete(filePath);
        }, DEBOUNCE_MS));
    });

    watchers.set(filePath, watcher);
}

function watchFolder(folder) {
    if (!watchers.has(folder)) {
        const dirWatcher = fs.watch(folder, { persistent: true }, () => scanFolder(folder));
        watchers.set(folder, dirWatcher);
    }
    scanFolder(folder);
}

function scanFolder(folder) {
    fs.readdir(folder, { withFileTypes: true }, (err, entries) => {
        if (err) return console.error(err);

        for (const entry of entries) {
            const fullPath = resolve(folder, entry.name);

            if (entry.isDirectory()) {
                watchFolder(fullPath);
            } else if (entry.isFile()) {
                watchFile(fullPath);
            }
        }
    });
}

watchFolder(folderPath);
