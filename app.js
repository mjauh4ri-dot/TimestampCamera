/* =========================================
   TIMESTAMP CAMERA V2
   ========================================= */

const camera =
    document.getElementById("camera");

const canvas =
    document.getElementById("photoCanvas");

const timestamp =
    document.getElementById("timestamp");

const timestampText =
    document.getElementById("timestampText");

const locationText =
    document.getElementById("locationText");

const watermarkText =
    document.getElementById("watermarkText");

const startScreen =
    document.getElementById("startScreen");

const settingsPanel =
    document.getElementById("settingsPanel");

const zoomValue =
    document.getElementById("zoomValue");


/* =========================================
   VARIABLES
   ========================================= */

let stream = null;

let facingMode = "environment";

let currentZoom = 1;

let flashEnabled = false;

let gpsLatitude = null;

let gpsLongitude = null;


/* =========================================
   ELEMENTS
   ========================================= */

const startCameraButton =
    document.getElementById("startCamera");

const captureButton =
    document.getElementById("captureButton");

const cameraSwitch =
    document.getElementById("cameraSwitch");

const flashButton =
    document.getElementById("flashButton");

const settingsButton =
    document.getElementById("settingsButton");

const closeSettings =
    document.getElementById("closeSettings");

const closeSettingsButton =
    document.getElementById(
        "closeSettingsButton"
    );

const showLocation =
    document.getElementById("showLocation");

const showSeconds =
    document.getElementById("showSeconds");

const fontSize =
    document.getElementById("fontSize");

const timestampPosition =
    document.getElementById(
        "timestampPosition"
    );

const watermarkInput =
    document.getElementById(
        "watermarkInput"
    );

const zoomMinus =
    document.getElementById("zoomMinus");

const zoomPlus =
    document.getElementById("zoomPlus");


/* =========================================
   START CAMERA
   ========================================= */

async function startCamera() {

    try {

        if (stream) {

            stream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );
        }


        stream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            facingMode,

                        width: {
                            ideal: 1920
                        },

                        height: {
                            ideal: 1080
                        }
                    },

                    audio: false
                });


        camera.srcObject =
            stream;


        startScreen.style.display =
            "none";


        resetZoom();

        requestGPS();


        showToast(
            "Kamera siap"
        );


    } catch (error) {

        console.error(error);

        showToast(
            "Tidak dapat membuka kamera. Izinkan Camera di Safari."
        );
    }
}


/* =========================================
   CAMERA SWITCH
   ========================================= */

cameraSwitch.addEventListener(
    "click",
    async () => {

        facingMode =
            facingMode === "environment"
                ? "user"
                : "environment";

        await startCamera();
    }
);


/* =========================================
   GPS
   ========================================= */

function requestGPS() {

    if (
        !navigator.geolocation
    ) {

        locationText.textContent =
            "";

        return;
    }


    navigator
        .geolocation
        .getCurrentPosition(

            position => {

                gpsLatitude =
                    position.coords.latitude;

                gpsLongitude =
                    position.coords.longitude;


                updateLocationDisplay();
            },

            error => {

                console.log(
                    "GPS:",
                    error
                );

                locationText.textContent =
                    "";
            },

            {

                enableHighAccuracy:
                    true,

                timeout:
                    10000,

                maximumAge:
                    0
            }
        );
}


/* =========================================
   LOCATION DISPLAY
   ========================================= */

function updateLocationDisplay() {

    if (
        !showLocation.checked
    ) {

        locationText.textContent =
            "";

        return;
    }


    if (
        gpsLatitude === null
    ) {

        locationText.textContent =
            "📍 Mencari lokasi…";

        return;
    }


    locationText.textContent =
        `📍 ${gpsLatitude.toFixed(6)}, ${gpsLongitude.toFixed(6)}`;
}


/* =========================================
   TIMESTAMP
   ========================================= */

function updateTimestamp() {

    const now =
        new Date();


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const year =
        now.getFullYear();


    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    const seconds =
        String(
            now.getSeconds()
        ).padStart(2, "0");


    let result =
        `${day}/${month}/${year} ${hours}:${minutes}`;


    if (
        showSeconds.checked
    ) {

        result +=
            `:${seconds}`;
    }


    timestampText.textContent =
        result;


    updateLocationDisplay();


    watermarkText.textContent =
        watermarkInput.value;

}


setInterval(
    updateTimestamp,
    250
);

updateTimestamp();


/* =========================================
   SETTINGS
   ========================================= */

settingsButton.addEventListener(
    "click",
    () => {

        settingsPanel.classList
            .remove("hidden");
    }
);


closeSettings.addEventListener(
    "click",
    () => {

        settingsPanel.classList
            .add("hidden");
    }
);


closeSettingsButton.addEventListener(
    "click",
    () => {

        settingsPanel.classList
            .add("hidden");
    }
);


/* =========================================
   SHOW LOCATION
   ========================================= */

showLocation.addEventListener(
    "change",
    () => {

        updateLocationDisplay();
    }
);


/* =========================================
   FONT SIZE
   ========================================= */

fontSize.addEventListener(
    "input",
    () => {

        timestamp.style.fontSize =
            `${fontSize.value}px`;
    }
);


/* =========================================
   POSITION
   ========================================= */

timestampPosition.addEventListener(
    "change",
    () => {

        timestamp.classList.remove(
            "bottom-right",
            "top-left",
            "top-right"
        );


        const position =
            timestampPosition.value;


        if (
            position !==
            "bottom-left"
        ) {

            timestamp.classList.add(
                position
            );
        }
    }
);


/* =========================================
   WATERMARK
   ========================================= */

watermarkInput.addEventListener(
    "input",
    () => {

        watermarkText.textContent =
            watermarkInput.value;
    }
);


/* =========================================
   ZOOM
   ========================================= */

function resetZoom() {

    currentZoom = 1;

    zoomValue.textContent =
        "1×";

    camera.style.transform =
        "scale(1)";
}


function applyZoom() {

    camera.style.transform =
        `scale(${currentZoom})`;

    zoomValue.textContent =
        `${currentZoom.toFixed(1)}×`;
}


zoomPlus.addEventListener(
    "click",
    () => {

        currentZoom =
            Math.min(
                5,
                currentZoom + 0.5
            );

        applyZoom();
    }
);


zoomMinus.addEventListener(
    "click",
    () => {

        currentZoom =
            Math.max(
                1,
                currentZoom - 0.5
            );

        applyZoom();
    }
);


/* =========================================
   FLASH
   ========================================= */

flashButton.addEventListener(
    "click",
    async () => {

        flashEnabled =
            !flashEnabled;


        const track =
            stream?.getVideoTracks()[0];


        if (
            track &&
            track.getCapabilities
        ) {

            const capabilities =
                track.getCapabilities();


            if (
                capabilities.torch
            ) {

                try {

                    await track.applyConstraints({

                        advanced: [
                            {
                                torch:
                                    flashEnabled
                            }
                        ]
                    });

                } catch (error) {

                    console.log(
                        error
                    );
                }
            }
        }


        flashButton.style
            .background =
            flashEnabled
                ? "rgba(255,255,255,.35)"
                : "rgba(0,0,0,.38)";
    }
);


/* =========================================
   TAKE PHOTO
   ========================================= */

captureButton.addEventListener(
    "click",
    capturePhoto
);


function capturePhoto() {

    if (!stream) {

        showToast(
            "Buka kamera terlebih dahulu."
        );

        return;
    }


    const width =
        camera.videoWidth;

    const height =
        camera.videoHeight;


    if (
        !width ||
        !height
    ) {

        showToast(
            "Kamera belum siap."
        );

        return;
    }


    canvas.width =
        width;

    canvas.height =
        height;


    const ctx =
        canvas.getContext(
            "2d"
        );


    /*
       FOTO ASLI
    */

    ctx.save();


    /*
       Jika kamera depan,
       gambar dibalik seperti preview.
    */

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
       TIMESTAMP
    */

    const now =
        new Date();


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const year =
        now.getFullYear();


    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    const seconds =
        String(
            now.getSeconds()
        ).padStart(2, "0");


    let timestampValue =
        `${day}/${month}/${year} ${hours}:${minutes}`;


    if (
        showSeconds.checked
    ) {

        timestampValue +=
            `:${seconds}`;
    }


    const fontSizeValue =
        Math.max(
            24,
            Math.round(
                width / 55
            )
        );


    const margin =
        Math.round(
            width * 0.035
        );


    /*
       TEKS
       TANPA BACKGROUND
    */

    ctx.font =
        `600 ${fontSizeValue}px Arial`;


    ctx.fillStyle =
        "#ffffff";


    ctx.shadowColor =
        "rgba(0,0,0,.90)";


    ctx.shadowBlur =
        5;


    ctx.shadowOffsetX =
        1;

    ctx.shadowOffsetY =
        1;


    let x =
        margin;


    let y =
        height -
        margin;


    /*
       POSISI
    */

    const position =
        timestampPosition.value;


    const textWidth =
        ctx.measureText(
            timestampValue
        ).width;


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
            fontSizeValue;
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
            fontSizeValue;
    }


    /*
       TULIS TIMESTAMP
    */

    ctx.fillText(
        timestampValue,
        x,
        y
    );


    /*
       GPS
    */

    if (
        showLocation.checked &&
        gpsLatitude !== null
    ) {

        const gps =
            `📍 ${gpsLatitude.toFixed(6)}, ${gpsLongitude.toFixed(6)}`;


        ctx.font =
            `500 ${Math.round(
                fontSizeValue * .52
            )}px Arial`;


        ctx.fillText(
            gps,
            x,
            y +
                fontSizeValue * .65
        );
    }


    /*
       WATERMARK
    */

    if (
        watermarkInput.value
    ) {

        ctx.font =
            `600 ${Math.round(
                fontSizeValue * .52
            )}px Arial`;


        ctx.fillText(
            watermarkInput.value,
            x,
            y +
                fontSizeValue * 1.25
        );
    }


    ctx.shadowBlur =
        0;

    ctx.shadowOffsetX =
        0;

    ctx.shadowOffsetY =
        0;


    /*
       SIMPAN
    */

    canvas.toBlob(

        blob => {

            if (!blob) {

                showToast(
                    "Gagal membuat foto."
                );

                return;
            }


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                `Timestamp_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.jpg`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                () =>
                    URL.revokeObjectURL(
                        url
                    ),
                2000
            );


            showToast(
                "Foto timestamp dibuat."
            );

        },

        "image/jpeg",

        0.95
    );
}


/* =========================================
   GALLERY BUTTON
   ========================================= */

document
    .getElementById("galleryButton")
    .addEventListener(
        "click",
        () => {

            showToast(
                "Foto tersimpan melalui Safari."
            );
        }
    );


/* =========================================
   TOAST
   ========================================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2200
    );
}


/* =========================================
   FOCUS TAP
   ========================================= */

camera.addEventListener(
    "click",
    event => {

        const box =
            document.getElementById(
                "focusBox"
            );


        box.style.left =
            `${event.clientX}px`;


        box.style.top =
            `${event.clientY}px`;


        box.style.display =
            "block";


        setTimeout(
            () => {

                box.style.left =
                    "50%";

                box.style.top =
                    "50%";

            },
            700
        );
    }
);


/* =========================================
   CLEANUP
   ========================================= */

window.addEventListener(
    "pagehide",
    () => {

        if (stream) {

            stream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );
        }
    }
);