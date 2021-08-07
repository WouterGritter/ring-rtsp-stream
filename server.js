require('dotenv').config();

const RingApi = require('ring-client-api').RingApi;

const ringApi = new RingApi({
    refreshToken: process.env.RING_TOKEN,
    debug: true,
});

function startRtspStream(camera) {
    let cameraId = camera.initialData.device_id;
    let rtspUrl = `${process.env.RTSP_URL}/cam-${cameraId}`;

    console.log(`Starting rtsp video stream of camera ${cameraId} to ${rtspUrl}`);

    camera.streamVideo({
        output: [
            '-f',
            'rtsp',
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-tune',
            'zerolatency',
            '-b',
            process.env.VIDEO_BITRATE,
            '-filter:v',
            `fps=${process.env.VIDEO_FRAMERATE}`,
            rtspUrl,
        ],
    }).then(sipSession => {
        console.log('Ring call started.');

        sipSession.onCallEnded.subscribe(() => {
            console.log('Ring call has ended! Trying to reconnect in 30 seconds..');

            setInterval(() => {
                startRtspStream(camera);
            }, 1000 * 30);
        });
    });
}

ringApi.getCameras().then(cameras => {
    console.log(`Found ${cameras.length} camera(s).`);
    for(let camera of cameras) {
        startRtspStream(camera);
    }
});
