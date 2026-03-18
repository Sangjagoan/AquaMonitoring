
"use strict";
window.activeDevice = localStorage.getItem("activeDevice") || null;
/* ========================================
 SYSTEM MONITORING
======================================== */

// 🔥 ambil dari global
window.devices
window.activeDevice

async function loadSystemStatus(d) {
    console.log("System status:", d);

    document.getElementById("heapValue").textContent =
        (d.hp / 1024).toFixed(1) + " KB";

    document.getElementById("minHeapValue").textContent =
        (d.mh / 1024).toFixed(1) + " KB";

    document.getElementById("maxBlockValue").textContent =
        (d.mb / 1024).toFixed(1) + " KB";

    const percent = (d.hp / 320000) * 100;

    document.getElementById("heapBar").style.width =
        percent + "%";

    document.getElementById("queueCountValue").textContent = d.mq;
    document.getElementById("sensorValue").textContent = d.s;
    document.getElementById("wdtValue").textContent = d.w;
    document.getElementById("ntpValue").textContent = d.n;
    document.getElementById("plcValue").textContent = d.p;
    document.getElementById("healthValue").textContent = d.h;
    document.getElementById("mqttValue").textContent = d.m;
    document.getElementById("telValue").textContent = d.t;
    document.getElementById("debugValue").textContent = d.d;

    document.getElementById("debugConsole").textContent =
        JSON.stringify(d, null, 2);
}

function updateHealthUI(data) {

    const el = document.getElementById("sysHealth");

    if (!el) return;

    el.innerText = data.hl;

    el.classList.remove("green", "yellow", "red");

    if (data.hl === "HEALTHY") el.classList.add("green");
    else if (data.hl === "WARNING") el.classList.add("yellow");
    else el.classList.add("red");
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
}

function onMQTTData(topic, data) {
    const parts = topic.split("/");
    if (parts.length < 3) return;

    const deviceId = parts[1];
    const type = parts[2];
    const sub = parts[3];

    // filter device valid
    if (!window.devices) window.devices = {};

    if (!window.devices[deviceId]) {
        window.devices[deviceId] = {};
    }

    Object.assign(window.devices[deviceId], data);

    if (typeof updateDeviceSelector === "function") {
        updateDeviceSelector();
    }

    if (!window.activeDevice && !localStorage.getItem("activeDevice")) {
        window.activeDevice = deviceId;
    }

    if (type === "data" && deviceId === window.activeDevice) {
        loadSystemStatus(data);
        updateHealthUI(data);

        console.log("SYSTEM RX:", topic, data);
    }

    if (type === "uptime" && deviceId === window.activeDevice) {

        console.log("UPTIME:", topic, data);

        const d = typeof data === "string" ? JSON.parse(data) : data;

        document.getElementById("uptimeValue").textContent = formatUptime(d.up);
    }


}

window.addEventListener("load", () => {
    mqttStart();
});