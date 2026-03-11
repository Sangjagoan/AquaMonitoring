
function updateWifiIcon(rssi, connected) {

    const arc2 = document.getElementById("arc2");
    const arc3 = document.getElementById("arc3");
    const arc4 = document.getElementById("arc4");
    const dot = document.getElementById("dot");

    if (!arc2 || !arc3 || !arc4 || !dot) return;

    // reset warna
    [arc2, arc3, arc4].forEach(a => a.setAttribute("stroke", "var(--text-muted)"));
    dot.setAttribute("fill", "var(--text-muted");

    if (!connected) return;

    let level = 0;

    if (rssi > -50) level = 4;
    else if (rssi > -60) level = 3;
    else if (rssi > -70) level = 2;
    else if (rssi > -80) level = 1;

    let color = "var(--text-primary)";
    if (rssi <= -70) color = "var(--los";
    if (rssi <= -80) color = "var(--wifi-diconnected)";

    // 🔥 DOT SELALU NYALA JIKA CONNECTED
    dot.setAttribute("fill", color);

    if (level >= 1) arc2.setAttribute("stroke", color);
    if (level >= 2) arc3.setAttribute("stroke", color);
    if (level >= 3) arc4.setAttribute("stroke", color);

}

async function updateTopWifiStatus() {

    try {
        const res = await fetch("/wifi/status");
        const data = await res.json();

        const text = document.getElementById("topWifiText");

        if (data.connected) {
            text.textContent = "Connected";
            text.style.color = "var(--text-primary)";
        } else {
            text.textContent = "Offline";
            text.style.color = "var( --wifi-diconnected)";
        }

        document.getElementById("SSID").textContent = data.ssid || "-";
        document.getElementById("wifiIP").textContent = data.ip || "-";
        document.getElementById("wifiRSSI").textContent = data.rssi + " dBm";
        // 🔥 INI YANG WAJIB ADA
        updateWifiIcon(data.rssi, data.connected);

    } catch (e) {
        console.log("WiFi top status error");
    }
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
        MQTT_CONFIG.topic_wifi_set,
        JSON.stringify(payload)
    );

    const resultBox = document.getElementById("wifiResult");

    resultBox.innerText = "Mengirim konfigurasi WiFi...";
    resultBox.className = "status";

}

function onMQTTWifi(topic, data) {
    // 🔹 STATUS WIFI
    if (topic === "esp32/config/wifi/state") {

        console.log("Status Wifi:", data);
        const resultBox = document.getElementById("wifiResult");

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

    // 🔹 WIFI SCAN RESULT
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
            option.textContent = `${bars}  ${net.ssid}  ${net.rssi} dBm ${lock} ${active}`;

            if (net.ssid === currentSSID) {
                option.selected = true;
            }

            select.appendChild(option);

        });

        return;
    }

}

function getWifiBars(rssi) {

    if (rssi > -55) return "🟢████";   // sangat kuat
    if (rssi > -65) return "🟢███▁";   // kuat
    if (rssi > -75) return "🟡██▁▁";   // sedang
    return "🔴█▁▁▁";                  // lemah

}

window.addEventListener("load", () => {

    mqttStart();

});