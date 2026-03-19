"use strict";

window.devices = window.devices || {};
window.activeDevice = localStorage.getItem("activeDevice") || null;

function updateDeviceSelector() {

    const select = document.getElementById("deviceSelect");
    if (!select) return;

    select.innerHTML = "";

    Object.keys(window.devices)
        .filter(id => id.startsWith("ESP32_")) // 🔥 FILTER BIAR BERSIH
        .forEach(id => {

            const option = document.createElement("option");
            option.value = id;
            option.textContent =
                (window.deviceNames && window.deviceNames[id]) || id;

            if (window.activeDevice === id) {
                option.selected = true;
            }

            select.appendChild(option);
        });
}

document.addEventListener("change", (e) => {

    if (e.target.id === "deviceSelect") {

        window.activeDevice = e.target.value;
        localStorage.setItem("activeDevice", window.activeDevice);

        console.log("SWITCH DEVICE:", window.activeDevice);

        // 🔥 refresh semua UI
        if (typeof renderDevices === "function") renderDevices();
        if (typeof refreshDeviceUI === "function") refreshDeviceUI();
    }
});


