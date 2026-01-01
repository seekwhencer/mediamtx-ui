const wsPort = 35729;
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsHost = window.location.hostname;
const ws = new WebSocket(`${protocol}://${wsHost}:${wsPort}`);

const linkMap = new Map();

function reloadOrAddLink(filePath) {
    const fileName = filePath.split('/').pop();
    let link = linkMap.get(fileName);

    if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = filePath;
        document.head.appendChild(link);
        linkMap.set(fileName, link);
        console.log(`CSS added: ${filePath}`);
    } else {
        const href = link.href.split('?')[0];
        link.href = `${href}?t=${Date.now()}`;
        console.log(`CSS reloaded: ${filePath}`);
    }
}

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'reload-css') {
        const relativePath = msg.file.replace(/^.*public\//, '');
        reloadOrAddLink(relativePath);
    }
};