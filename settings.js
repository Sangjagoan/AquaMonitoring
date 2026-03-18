"use strict";

let deviceNames = JSON.parse(localStorage.getItem("deviceNames") || "{}");

window.devices
window.activeDevice

function updateWifiIcon(rssi, connected) {

    const arc2 = document.getElementById("arc2");
    const arc3 = document.getElementById("arc3");
    const arc4 = document.getElementById("arc4");
    const dot = document.getElementById("dot");

    if (!arc2 || !arc3 || !arc4 || !dot) return;

    // reset warna
    [arc2, arc3, arc4].forEach(a => a.setAttribute("stroke", "var(--text-muted)"));
    dot.setAttribute("fill", "var(--text-muted)");

    if (!connected) return;

    let level = 0;

    if (rssi > -50) level = 4;
    else if (rssi > -60) level = 3;
    else if (rssi > -70) level = 2;
    else if (rssi > -80) level = 1;

    let color = "var(--text-primary)";

    if (rssi <= -70) color = "var(--loss)";
    if (rssi <= -80) color = "var(--wifi-disconnected)";

    dot.setAttribute("fill", color);

    if (level >= 1) arc2.setAttribute("stroke", color);
    if (level >= 2) arc3.setAttribute("stroke", color);
    if (level >= 3) arc4.setAttribute("stroke", color);
}

function scanWiFi() {

    const select = document.getElementById("wifiSSID");

    if (select)
        select.innerHTML = "<option>Scanning WiFi...</option>";

    if (!mqttClient || !mqttClient.connected) {
        select.innerHTML = "<option>MQTT not connected</option>";
        return;
    }

    mqttClient.publish("panel/cmd/wifi/scan", "{}");
}

function save() {

    console.log("simpan wifi clicked");

    if (!confirm(" pastikan ssid dan passwordnya sudah benar, simpan wifi akan membuat esp restart, apakah kamu yakin?, kalau sudah yakin tekan oke")) return;

    const ssid = document.getElementById("wifiSSID").value;
    const pass = document.getElementById("wifiPASS").value;

    if (!ssid) {
        alert("SSID tidak boleh kosong!");
        return;
    }

    const payload = {
        ssid: ssid,
        password: pass
    };

    mqttClient.publish(
        "esp32/config/wifi/set",
        JSON.stringify(payload)
    );

    const resultBox = document.getElementById("wifiResult");

    resultBox.innerText = "Mengirim konfigurasi WiFi...";
    resultBox.className = "status";
}

function restartEsp() {

    if (!confirm("⚠ Restart ESP32?\nPerangkat akan restart.")) return;

    if (!confirm("Konfirmasi lagi.\nkalau sudah yakin ESP akan restart.")) return;

    let countdown = 5;

    const timer = setInterval(() => {

        console.log("Restart dalam", countdown, "detik");

        const resultBox = document.getElementById("maintenanceStatus");
        if (resultBox) {
            resultBox.innerText = "Restart dalam " + countdown + " detik...";
            resultBox.className = "warning";
        }

        countdown--;

        if (countdown < 0) {

            clearInterval(timer);

            mqttClient.publish("esp32/config/esp/restart", "1");

            if (resultBox) {
                resultBox.innerText = "Restarting ESP32...";
            }
        }

    }, 1000);
}

function initResetPzem() {

    if (!confirm("Reset energy meter?")) return;

    const payload = {
        confirm: "YES"
    };

    mqttClient.publish(
        "esp32/panel/pzem/reset",
        JSON.stringify(payload)
    );

}

function onMQTTWifi(topic, data) {

    console.log("MQTT RX:", data);
    console.log("ACTIVE DEVICE:", window.activeDevice);

    const parts = topic.split("/");
    if (parts.length < 3) return;

    const deviceId = parts[1];
    const type = parts[2] || "";
    const sub = parts[3] || "";

    if (!deviceId.startsWith("ESP32_")) return;

    // ✅ INIT GLOBAL
    window.devices = window.devices || {};

    if (!window.devices[deviceId]) {
        window.devices[deviceId] = {};
    }

    Object.assign(window.devices[deviceId], data);

    // ✅ AUTO SET DEVICE PERTAMA
    if (!window.activeDevice) {
        window.activeDevice = deviceId;
        localStorage.setItem("activeDevice", deviceId);
    }

    // ✅ FILTER
    if (deviceId !== window.activeDevice) return;


    if (typeof updateDeviceSelector === "function") {
        updateDeviceSelector();
    }

    if (typeof renderDevices === "function") {
        renderDevices();
    }

    // ===== WIFI STATUS =====
    if (type === "wifi" && sub === "status") {

        const wifi = data;

        document.getElementById("SSID").innerText = wifi.ssid || "-";
        document.getElementById("wifiIP").innerText = wifi.ip || "-";
        document.getElementById("wifiSignal").innerText = wifi.rssi + " dBm";

        updateWifiIcon(wifi.rssi, wifi.connected);
    }
}

function getWifiBars(rssi) {

    if (rssi > -55) return "▁ ▂ ▃ ▅ ▆ ▇";
    if (rssi > -65) return "▁ ▂ ▃ ▅ ▆";
    if (rssi > -75) return "▁ ▂ ▃";
    if (rssi > -85) return "▁ ▂";
    if (rssi > -95) return "▁";
    return "🔴";
}

window.addEventListener("load", () => {
    mqttStart();
});