const camera = document.getElementById("camera");
const canvas = document.getElementById("photoCanvas");

const startScreen = document.getElementById("startScreen");
const startCameraButton = document.getElementById("startCamera");

const timestamp = document.getElementById("timestamp");
const timestampText = document.getElementById("timestampText");
const locationText = document.getElementById("locationText");
const watermarkText = document.getElementById("watermarkText");

const captureButton = document.getElementById("captureButton");
const cameraSwitch = document.getElementById("cameraSwitch");

const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const closeSettingsButton =
    document.getElementById("closeSettingsButton");

const showLocation =
    document.getElementById("showLocation");

const showSeconds =
    document.getElementById("showSeconds");

const fontSize =
    document.getElementById("fontSize");

const timestampPosition =
    document.getElementById("timestampPosition");

const watermarkInput =
    document.getElementById("watermarkInput");

const toast =
    document.getElementById("toast");


let stream = null;

let facingMode = "environment";

let latitude = null;
let longitude = null;


/* =========================================
   INITIAL
========================================= */

updateTimestamp();


/* =========================================
   TIMESTAMP
========================================= */

function updateTimestamp() {

    const now = new Date();

    const day =
        String(now.getDate()).padStart(2, "0");

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const year =
        now.getFullYear();

    const hour =
        String(now.getHours()).padStart(2, "0");

    const minute =
        String(now.getMinutes()).padStart(2, "0");

    const second =
        String(now.getSeconds()).padStart(2, "0");


    let text =
        `${day}/${month}/${year} ${hour}:${minute}`;


    if (showSeconds.checked) {

        text += `:${second}`;
    }


    timestampText.textContent = text;


    watermarkText.textContent =
        watermarkInput.value;


    updateGPSDisplay();
}


setInterval(
    updateTimestamp,
    250
);


/* =========================================
   GPS
========================================= */

function startGPS() {

    if (!navigator.geolocation) {

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function(position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;

            updateGPSDisplay();
        },

        function(error) {

            console.log(
                "GPS error:",
                error
            );

            locationText.textContent = "";
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


function updateGPSDisplay() {

    if (!showLocation.checked) {

        locationText.textContent = "";

        return;
    }


    if (
        latitude === null ||
        longitude === null
    ) {

        locationText.textContent =
            "📍 Mencari lokasi...";

        return;
    }


    locationText.textContent =
        `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}


/* =========================================
   OPEN CAMERA
========================================= */

async function openCamera() {

    try {

        /*
         * Pastikan browser mendukung kamera
         */

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            showError(
                "Kamera tidak tersedia di browser ini."
            );

            return;
        }


        /*
         * Matikan kamera lama
         */

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            stream = null;
        }


        /*
         * Request kamera
         *
         * Kita sengaja menggunakan
         * konfigurasi sederhana agar
         * kompatibel dengan Safari iPhone.
         */

        stream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode: {
                        ideal: facingMode
                    }

                },

                audio: false
            });


        /*
         * Masukkan stream ke video
         */

        camera.srcObject = stream;

        camera.muted = true;

        camera.playsInline = true;

        camera.setAttribute(
            "playsinline",
            ""
        );

        camera.setAttribute(
            "webkit-playsinline",
            ""
        );


        /*
         * Tunggu video siap
         */

        await new Promise(
            function(resolve) {

                if (
                    camera.readyState >= 2
                ) {

                    resolve();

                    return;
                }


                camera.onloadedmetadata =
                    function() {

                        resolve();
                    };
            }
        );


        /*
         * Mulai video
         */

        await camera.play();


        /*
         * Hilangkan layar awal
         */

        startScreen.style.display =
            "none";


        /*
         * GPS
         */

        startGPS();


        showToast(
            "Kamera berhasil dibuka"
        );

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        /*
         * Matikan stream jika gagal
         */

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            stream = null;
        }


        showError(
            "Kamera gagal dibuka: " +
            error.name
        );
    }
}


/* =========================================
   START BUTTON
========================================= */

startCameraButton.addEventListener(
    "click",
    function() {

        openCamera();

    }
);


/* =========================================
   SWITCH CAMERA
========================================= */

cameraSwitch.addEventListener(
    "click",
    async function() {

        if (!stream) {

            await openCamera();

            return;
        }


        facingMode =
            facingMode === "environment"
                ? "user"
                : "environment";


        await openCamera();
    }
);


/* =========================================
   TAKE PHOTO
========================================= */

captureButton.addEventListener(
    "click",
    function() {

        takePhoto();

    }
);


function takePhoto() {

    if (!stream) {

        showError(
            "Kamera belum dibuka."
        );

        return;
    }


    const width =
        camera.videoWidth;

    const height =
        camera.videoHeight;


    if (!width || !height) {

        showError(
            "Kamera belum siap."
        );

        return;
    }


    canvas.width = width;
    canvas.height = height;


    const ctx =
        canvas.getContext("2d");


    /*
     * Gambar kamera
     */

    ctx.save();


    if (
        facingMode === "user"
    ) {

        ctx.translate(
            width,
            0
        );

        ctx.scale(
            -1,
            1
        );
    }


    ctx.drawImage(
        camera,
        0,
        0,
        width,
        height
    );


    ctx.restore();


    /*
     * TIMESTAMP
     */

    const now = new Date();

    const day =
        String(now.getDate()).padStart(2, "0");

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const year =
        now.getFullYear();

    const hour =
        String(now.getHours()).padStart(2, "0");

    const minute =
        String(now.getMinutes()).padStart(2, "0");

    const second =
        String(now.getSeconds()).padStart(2, "0");


    let stamp =
        `${day}/${month}/${year} ${hour}:${minute}`;


    if (showSeconds.checked) {

        stamp += `:${second}`;
    }


    /*
     * Ukuran tulisan
     */

    const size =
        Math.max(
            24,
            Math.round(width / 55)
        );


    const margin =
        Math.round(
            width * 0.035
        );


    ctx.font =
        `600 ${size}px Arial`;


    ctx.fillStyle =
        "#ffffff";


    /*
     * SHADOW SAJA
     *
     * Tidak ada background.
     */

    ctx.shadowColor =
        "rgba(0,0,0,0.9)";

    ctx.shadowBlur = 5;

    ctx.shadowOffsetX = 1;

    ctx.shadowOffsetY = 1;


    /*
     * Posisi default:
     * kiri bawah
     */

    let x = margin;

    let y =
        height - margin;


    const position =
        timestampPosition.value;


    const textWidth =
        ctx.measureText(stamp).width;


    if (
        position ===
        "bottom-right"
    ) {

        x =
            width -
            margin -
            textWidth;
    }


    if (
        position ===
        "top-left"
    ) {

        y =
            margin +
            size;
    }


    if (
        position ===
        "top-right"
    ) {

        x =
            width -
            margin -
            textWidth;

        y =
            margin +
            size;
    }


    /*
     * TULIS TIMESTAMP
     */

    ctx.fillText(
        stamp,
        x,
        y
    );


    /*
     * GPS
     */

    if (
        showLocation.checked &&
        latitude !== null &&
        longitude !== null
    ) {

        ctx.font =
            `500 ${Math.round(size * 0.5)}px Arial`;


        ctx.fillText(
            `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            x,
            y + size * 0.65
        );
    }


    /*
     * WATERMARK
     */

    if (
        watermarkInput.value.trim()
    ) {

        ctx.font =
            `600 ${Math.round(size * 0.5)}px Arial`;


        ctx.fillText(
            watermarkInput.value.trim(),
            x,
            y + size * 1.25
        );
    }


    /*
     * Hapus shadow
     */

    ctx.shadowBlur = 0;

    ctx.shadowOffsetX = 0;

    ctx.shadowOffsetY = 0;


    /*
     * SIMPAN JPEG
     */

    canvas.toBlob(

        function(blob) {

            if (!blob) {

                showError(
                    "Gagal membuat foto."
                );

                return;
            }


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;


            link.download =
                `Timestamp_${year}-${month}-${day}_${hour}-${minute}-${second}.jpg`;


            document.body.appendChild(link);


            link.click();


            link.remove();


            setTimeout(
                function() {

                    URL.revokeObjectURL(
                        url
                    );

                },
                2000
            );


            showToast(
                "Foto berhasil dibuat"
            );

        },

        "image/jpeg",

        0.95
    );
}


/* =========================================
   SETTINGS
========================================= */

settingsButton.addEventListener(
    "click",
    function() {

        settingsPanel.classList.remove(
            "hidden"
        );
    }
);


closeSettings.addEventListener(
    "click",
    function() {

        settingsPanel.classList.add(
            "hidden"
        );
    }
);


closeSettingsButton.addEventListener(
    "click",
    function() {

        settingsPanel.classList.add(
            "hidden"
        );
    }
);


/* =========================================
   SETTINGS EVENTS
========================================= */

showLocation.addEventListener(
    "change",
    updateGPSDisplay
);


showSeconds.addEventListener(
    "change",
    updateTimestamp
);


fontSize.addEventListener(
    "input",
    function() {

        timestamp.style.fontSize =
            fontSize.value + "px";
    }
);


timestampPosition.addEventListener(
    "change",
    function() {

        timestamp.classList.remove(
            "bottom-right",
            "top-left",
            "top-right"
        );


        if (
            timestampPosition.value !==
            "bottom-left"
        ) {

            timestamp.classList.add(
                timestampPosition.value
            );
        }
    }
);


watermarkInput.addEventListener(
    "input",
    updateTimestamp
);


/* =========================================
   MESSAGE
========================================= */

function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add("show");


    setTimeout(
        function() {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );
}


function showError(message) {

    /*
     * Tampilkan error secara jelas
     * supaya kita tahu penyebabnya.
     */

    toast.textContent =
        message;

    toast.classList.add("show");


    console.error(message);


    setTimeout(
        function() {

            toast.classList.remove(
                "show"
            );

        },
        5000
    );
}


/* =========================================
   CLEANUP
========================================= */

window.addEventListener(
    "pagehide",
    function() {

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    track => track.stop()
                );
        }
    }
);