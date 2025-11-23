const video = document.getElementById('video');

const tracks = [
    {
        url: 'http://raspicam:8888/cam1/index.m3u8',
        element: document.querySelector('#cam1')
    },
    {
        url: 'http://raspicam:8888/cam2/index.m3u8',
        element: document.querySelector('#cam2')
    },
    {
        url: 'http://raspicam:8888/cam3/index.m3u8',
        element: document.querySelector('#cam3')
    },
    {
        url: 'http://raspicam:8888/cam4/index.m3u8',
        element: document.querySelector('#cam4')
    },
];


tracks.forEach(track => {
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(track.url);
        hls.attachMedia(track.element);
    } else {
        track.element.src = track.url;
    }
});
