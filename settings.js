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

// function restartEsp() {

//     console.log("Reset wifi clicked");

//     if (!confirm("Yakin mau Restart EPS?")) return;

//     mqttClient.publish("esp32/config/esp/restart", "1");
// }

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

function onMQTTWifi(topic, data) {

    // ===== WIFI STATUS =====
    if (topic === "esp32/config/wifi/state") {

        const resultBox = document.getElementById("wifiInf");

        if (!resultBox) return;

        if (data === "CONNECTED") {

            resultBox.innerText = "CONNECTED";
            resultBox.className = "success";

        } else {

            resultBox.innerText = "DISCONNECTED";
            resultBox.className = "fail";
        }

        return;
    }

    // ===== WIFI SCAN RESULT =====
    if (topic === "panel/wifi/list") {

        const list = JSON.parse(data);

        const select = document.getElementById("wifiSSID");
        if (!select) return;

        select.innerHTML = "";

        let currentSSID = document.getElementById("SSID")?.innerText || "";
        currentSSID = currentSSID.match(/[A-Za-z0-9_\-]+/)?.[0] || "";

        list.sort((a, b) => b.rssi - a.rssi);

        list.forEach(net => {

            const option = document.createElement("option");

            const bars = getWifiBars(net.rssi);
            const lock = net.enc ? "🔒" : "";
            const active = (net.ssid === currentSSID) ? "⭐" : "";

            option.value = net.ssid;
            option.textContent = `${bars} ${net.ssid} (${net.rssi} dBm) ${lock} ${active}`;

            if (net.ssid === currentSSID) {
                option.selected = true;
            }

            select.appendChild(option);

        });

        return;
    }

    // ===== WIFI STATUS DETAIL =====
    if (topic === "esp32/wifi/status") {

        const wifi = typeof data === "string" ? JSON.parse(data) : data;

        const resultBox = document.getElementById("wifiResult");

        document.getElementById("SSID").innerText = wifi.ssid || "-";
        document.getElementById("wifiIP").innerText = wifi.ip || "-";
        document.getElementById("wifiSignal").innerText = wifi.rssi + " dBm";

        updateWifiIcon(wifi.rssi, wifi.connected);

        if (wifi.connected) {

            resultBox.innerText = "CONNECTED";
            resultBox.className = "success";

        } else {

            resultBox.innerText = "DISCONNECTED";
            resultBox.className = "error";
        }
    }

    if (topic === "esp32/config/wifi/progress") {

        console.log("Progress Wifi:", data);
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