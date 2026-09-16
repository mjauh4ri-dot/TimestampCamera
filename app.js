const camera=document.getElementById("camera");
const canvas=document.getElementById("photoCanvas");
const startScreen=document.getElementById("startScreen");
const startCameraButton=document.getElementById("startCamera");
const timestamp=document.getElementById("timestamp");
const timestampText=document.getElementById("timestampText");
const locationText=document.getElementById("locationText");
const watermarkText=document.getElementById("watermarkText");
const captureButton=document.getElementById("captureButton");
const cameraSwitch=document.getElementById("cameraSwitch");
const flashButton=document.getElementById("flashButton");
const settingsButton=document.getElementById("settingsButton");
const settingsPanel=document.getElementById("settingsPanel");
const closeSettings=document.getElementById("closeSettings");
const closeSettingsButton=document.getElementById("closeSettingsButton");
const showLocation=document.getElementById("showLocation");
const showSeconds=document.getElementById("showSeconds");
const fontSize=document.getElementById("fontSize");
const timestampPosition=document.getElementById("timestampPosition");
const watermarkInput=document.getElementById("watermarkInput");
const zoomMinus=document.getElementById("zoomMinus");
const zoomPlus=document.getElementById("zoomPlus");
const zoomValue=document.getElementById("zoomValue");
const focusBox=document.getElementById("focusBox");
const toast=document.getElementById("toast");

let stream=null;
let facingMode="environment";
let flashEnabled=false;
let currentZoom=1;
let gpsLatitude=null;
let gpsLongitude=null;

function parts(date=new Date()){
    return {
        day:String(date.getDate()).padStart(2,"0"),
        month:String(date.getMonth()+1).padStart(2,"0"),
        year:String(date.getFullYear()),
        hour:String(date.getHours()).padStart(2,"0"),
        minute:String(date.getMinutes()).padStart(2,"0"),
        second:String(date.getSeconds()).padStart(2,"0")
    };
}

function stamp(date=new Date()){
    const p=parts(date);
    let s=`${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
    if(showSeconds.checked)s+=`:${p.second}`;
    return s;
}

function updateTimestamp(){
    timestampText.textContent=stamp();
    watermarkText.textContent=watermarkInput.value.trim();
    updateGPSDisplay();
}
setInterval(updateTimestamp,250);
updateTimestamp();

function requestGPS(){
    if(!navigator.geolocation)return;
    navigator.geolocation.getCurrentPosition(
        p=>{
            gpsLatitude=p.coords.latitude;
            gpsLongitude=p.coords.longitude;
            updateGPSDisplay();
        },
        e=>{
            console.log("GPS:",e);
            locationText.textContent="";
        },
        {enableHighAccuracy:true,timeout:10000,maximumAge:0}
    );
}

function updateGPSDisplay(){
    if(!showLocation.checked){
        locationText.textContent="";
        return;
    }
    if(gpsLatitude===null){
        locationText.textContent="📍 Mencari lokasi...";
        return;
    }
    locationText.textContent=`📍 ${gpsLatitude.toFixed(6)}, ${gpsLongitude.toFixed(6)}`;
}

async function startCamera(){
    try{
        if(!navigator.mediaDevices?.getUserMedia)throw new Error("getUserMedia tidak tersedia");
        stopCamera();

        stream=await navigator.mediaDevices.getUserMedia({
            video:{
                facingMode:{ideal:facingMode},
                width:{ideal:1920},
                height:{ideal:1080}
            },
            audio:false
        });

        camera.srcObject=stream;
        camera.muted=true;
        camera.playsInline=true;
        camera.setAttribute("playsinline","");
        camera.setAttribute("webkit-playsinline","");
        await camera.play();

        startScreen.style.display="none";
        currentZoom=1;
        applyZoom();
        requestGPS();
        await updateFlashAvailability();
        showToast("Kamera siap");
    }catch(error){
        console.error("Camera error:",error);
        stopCamera();
        let msg="Kamera gagal dibuka.";
        if(error?.name==="NotAllowedError")msg="Izin kamera ditolak. Izinkan Camera untuk Safari.";
        else if(error?.name==="NotFoundError")msg="Kamera tidak ditemukan.";
        else if(error?.name==="NotReadableError")msg="Kamera sedang digunakan aplikasi lain.";
        else if(error?.name==="OverconstrainedError")msg="Pengaturan kamera tidak tersedia.";
        showToast(msg,5000);
    }
}

function stopCamera(){
    if(stream)stream.getTracks().forEach(t=>t.stop());
    stream=null;
    flashEnabled=false;
    flashButton.classList.remove("on");
}

async function updateFlashAvailability(){
    const track=stream?.getVideoTracks()?.[0];
    if(!track){
        flashButton.disabled=true;
        return;
    }

    let supported=false;
    try{
        const caps=typeof track.getCapabilities==="function"?track.getCapabilities():{};
        supported=caps.torch===true;
    }catch(e){console.log("Torch check:",e)}

    flashButton.disabled=!(supported||facingMode==="environment");
}

async function toggleFlash(){
    const track=stream?.getVideoTracks()?.[0];
    if(!track){showToast("Buka kamera terlebih dahulu.");return;}
    if(facingMode!=="environment"){showToast("Flash hanya untuk kamera belakang.");return;}

    try{
        const caps=typeof track.getCapabilities==="function"?track.getCapabilities():{};
        if(caps.torch===false){
            showToast("Flash tidak tersedia pada kamera ini.");
            return;
        }

        const next=!flashEnabled;
        await track.applyConstraints({advanced:[{torch:next}]});
        flashEnabled=next;
        flashButton.classList.toggle("on",flashEnabled);
        showToast(flashEnabled?"Flash menyala":"Flash mati");
    }catch(e){
        console.error("Flash error:",e);
        showToast("Flash tidak didukung Safari untuk kamera ini.",4000);
    }
}
flashButton.addEventListener("click",toggleFlash);

cameraSwitch.addEventListener("click",async()=>{
    facingMode=facingMode==="environment"?"user":"environment";
    await startCamera();
});

function applyZoom(){
    camera.style.transform=`scale(${currentZoom})`;
    camera.style.transformOrigin="center center";
    zoomValue.textContent=`${currentZoom.toFixed(1)}×`;
}
zoomPlus.addEventListener("click",()=>{currentZoom=Math.min(5,currentZoom+.5);applyZoom()});
zoomMinus.addEventListener("click",()=>{currentZoom=Math.max(1,currentZoom-.5);applyZoom()});

startCameraButton.addEventListener("click",startCamera);
captureButton.addEventListener("click",capturePhoto);

function visibleCrop(sw,sh){
    const vw=Math.max(1,camera.clientWidth);
    const vh=Math.max(1,camera.clientHeight);
    const sr=sw/sh, vr=vw/vh;
    let sx=0,sy=0,cw=sw,ch=sh;
    if(sr>vr){cw=sh*vr;sx=(sw-cw)/2}
    else if(sr<vr){ch=sw/vr;sy=(sh-ch)/2}
    return {sx,sy,cw,ch};
}

function capturePhoto(){
    if(!stream){showToast("Buka kamera terlebih dahulu.");return;}
    if(!camera.videoWidth||!camera.videoHeight){showToast("Kamera belum siap.");return;}

    const crop=visibleCrop(camera.videoWidth,camera.videoHeight);
    const w=Math.round(crop.cw),h=Math.round(crop.ch);
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d",{alpha:false});

    ctx.save();
    if(facingMode==="user"){ctx.translate(w,0);ctx.scale(-1,1)}
    ctx.drawImage(camera,crop.sx,crop.sy,crop.cw,crop.ch,0,0,w,h);
    ctx.restore();

    const now=new Date();
    const text=stamp(now);
    const size=Math.max(24,Math.round(Math.min(w,h)/22));
    const margin=Math.round(Math.min(w,h)*.035);

    ctx.font=`600 ${size}px Arial`;
    ctx.fillStyle="#fff";
    ctx.textBaseline="alphabetic";
    ctx.shadowColor="rgba(0,0,0,.92)";
    ctx.shadowBlur=5;
    ctx.shadowOffsetX=1;
    ctx.shadowOffsetY=1;

    let x=margin,y=h-margin;
    const pos=timestampPosition.value;
    const tw=ctx.measureText(text).width;

    if(pos==="bottom-right"){x=w-margin-tw;y=h-margin}
    if(pos==="bottom-left"){x=margin;y=h-margin}
    if(pos==="top-right"){x=w-margin-tw;y=margin+size}
    if(pos==="top-left"){x=margin;y=margin+size}

    ctx.fillText(text,x,y);

    if(showLocation.checked&&gpsLatitude!==null){
        const small=Math.max(14,Math.round(size*.52));
        ctx.font=`500 ${small}px Arial`;
        ctx.fillText(`GPS: ${gpsLatitude.toFixed(6)}, ${gpsLongitude.toFixed(6)}`,x,y+size*.65);
    }

    const wm=watermarkInput.value.trim();
    if(wm){
        const small=Math.max(14,Math.round(size*.52));
        ctx.font=`600 ${small}px Arial`;
        ctx.fillText(wm,x,y+size*1.25);
    }

    ctx.shadowBlur=0;
    ctx.shadowOffsetX=0;
    ctx.shadowOffsetY=0;

    canvas.toBlob(blob=>{
        if(!blob){showToast("Gagal membuat foto.");return}
        const url=URL.createObjectURL(blob);
        const p=parts(now);
        const a=document.createElement("a");
        a.href=url;
        a.download=`Timestamp_${p.year}-${p.month}-${p.day}_${p.hour}-${p.minute}-${p.second}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),2000);
        showToast("Foto berhasil disimpan.");
    },"image/jpeg",.95);
}

camera.addEventListener("click",e=>{
    focusBox.style.left=`${e.clientX}px`;
    focusBox.style.top=`${e.clientY}px`;
    clearTimeout(camera._focusTimer);
    camera._focusTimer=setTimeout(()=>{
        focusBox.style.left="50%";
        focusBox.style.top="50%";
    },700);
});

settingsButton.addEventListener("click",()=>settingsPanel.classList.remove("hidden"));
closeSettings.addEventListener("click",()=>settingsPanel.classList.add("hidden"));
closeSettingsButton.addEventListener("click",()=>settingsPanel.classList.add("hidden"));
showLocation.addEventListener("change",updateGPSDisplay);
showSeconds.addEventListener("change",updateTimestamp);
fontSize.addEventListener("input",()=>timestamp.style.fontSize=`${fontSize.value}px`);
timestampPosition.addEventListener("change",()=>{
    timestamp.classList.remove("bottom-right","bottom-left","top-right","top-left");
    timestamp.classList.add(timestampPosition.value);
});
watermarkInput.addEventListener("input",updateTimestamp);

document.getElementById("galleryButton").addEventListener("click",()=>showToast("Foto tersimpan melalui Safari."));

let toastTimer=null;
function showToast(message,duration=2200){
    toast.textContent=message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove("show"),duration);
}

window.addEventListener("pagehide",stopCamera);
window.addEventListener("beforeunload",stopCamera);
window.addEventListener("orientationchange",()=>setTimeout(updateTimestamp,150));
window.addEventListener("resize",updateTimestamp);