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

        renderNotifications();
        const selec = document.getElementById(window.activeDevice);
        if (!selec) return;

        // 🔥 refresh semua UI
        if (typeof renderDevices === "function") renderDevices();
        if (typeof refreshDeviceUI === "function") refreshDeviceUI();
    }

});


function renderDevices() {

    const container = document.getElementById("devices");
    if (!container) return;

    let html = "";

    Object.keys(window.devices).forEach(id => {

        const d = window.devices[id] || {};

        const name = (window.deviceNames && window.deviceNames[id]) || id;

        html += `
    <div class="card ${window.activeDevice === id ? 'active-device' : ''}" 
         onclick="switchDevice('${id}')">
        
        <h3 id="name-${id}">
            ${name}
        </h3>

        <small>${id}</small>

        <p>Pressure: ${d.kg ?? '-'}</p>
        <p>Level: ${d.lvl ?? '-'}</p>

    </div>
        `;
    });

    container.innerHTML = html;
}

function switchDevice(deviceId) {

    window.activeDevice = deviceId;
    localStorage.setItem("activeDevice", deviceId);

    // 🔥 RESET dulu biar gak nyangkut
    const el = document.getElementById("mqttStatus");
    if (el) el.innerText = "-";

    // 🔥 LOAD dari cache device
    if (typeof updateDeviceUI === "function") {
        updateDeviceUI(deviceId);
    }

    renderDevices();

    setTimeout(() => {
        document.getElementById(`name-${deviceId}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }, 100);
}

function updateDeviceUI(deviceId) {

    const device = window.devices?.[deviceId];
    const el = document.getElementById("mqttStatus");

    if (!el) return;

    if (!device || device.mq === undefined) {
        el.innerText = "-";
        return;
    }

    el.innerText = device.mq ? "Connected" : "Disconnected";
}


