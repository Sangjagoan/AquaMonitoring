"use strict";

window.devices = window.devices || {};
window.activeDevice = localStorage.getItem("activeDevice") || null;

function updateDeviceSelector() {

    const select = document.getElementById("deviceSelect");
    if (!select) return;

    select.innerHTML = "";

    Object.keys(window.devices).forEach(id => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = id;

        if (id === window.activeDevice) {
            opt.selected = true;
        }

        select.appendChild(opt);
    });
}

document.addEventListener("change", (e) => {

    if (e.target.id === "deviceSelect") {

        window.activeDevice = e.target.value;

        localStorage.setItem("activeDevice", window.activeDevice);

        console.log("SWITCH DEVICE:", window.activeDevice);

        if (typeof updateUIFromDevice === "function") {
            updateUIFromDevice();
        }
    }
});

function switchDevice(deviceId) {
    window.activeDevice = deviceId;
    localStorage.setItem("activeDevice", deviceId);

    console.log("Switch ke:", deviceId);
}