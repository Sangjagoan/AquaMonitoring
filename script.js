
"use strict";

let deviceNames = JSON.parse(localStorage.getItem("deviceNames") || "{}");

// 🔥 ambil dari global
const devices = window.devices;
window.activeDevice

function num(v) {
    return Number(v || 0);
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setLed(id, state, colorTrue = "#00ff00", colorFalse = "var(--geuge)") {
    const el = document.getElementById(id);
    if (!el) return;

    el.setAttribute("fill", state ? colorTrue : colorFalse);
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

    // validasi device
    if (!deviceId.includes("ESP32") && !deviceId.includes("MTQ")) return;

    if (typeof data !== "object" || data === null) return;

    // init global
    if (!window.devices) window.devices = {};

    // simpan data
    if (!window.devices[deviceId]) {
        window.devices[deviceId] = {};
    }
    Object.assign(window.devices[deviceId], data);

    // set active device pertama
    if (!window.activeDevice) {
        window.activeDevice = deviceId;
        localStorage.setItem("activeDevice", deviceId);
    }

    if (type === "data") {

        const charts = getDeviceChart(deviceId);

        // 🔥 SELALU simpan data (semua device)
        pushVoltage(charts.c1, data.v1);
        pushVoltage(charts.c2, data.v2);
        pushVoltage(charts.c3, data.tAir);

        // hanya render kalau aktif
        if (deviceId === window.activeDevice) {

            updateUIFromDevice();

            pushPressureCandle(PSI_CANDLE, data.psi);
            pushPressureCandle(KG_CANDLE, data.kg);

            drawPressureCandles(PSI_CANDLE, "pressurePsiChart");
            drawPressureCandles(KG_CANDLE, "pressureKgChart");
        }
    }

    // =========================
    // STATE
    // =========================
    if (type === "indikator" && sub === "state" && deviceId === window.activeDevice) {

        setLed("ledTutup", data.ot);
        setLed("ledBuka", data.ob);
    }

    // =========================
    // UPTIME
    // =========================
    if (type === "uptime" && deviceId === window.activeDevice) {

        const d = typeof data === "string" ? JSON.parse(data) : data;

        updateElement("uptime", formatUptime(d.up));

        console.log("UPTIME:", data);
    }
}

function updateUIFromDevice() {
    const id = window.activeDevice;
    if (!id) return;

    const d = window.devices[id];
    if (!d) return;

    const charts = getDeviceChart(id);

    console.log("RENDER DEVICE:", id, d);

    updateAquaBars(d.lvl, d.tAir, d.jar);
    updateElectrical(d);

    sparkline("sparkVoltLine1", "sparkVoltArea1", d.v1);
    sparkline("sparkVoltLine2", "sparkVoltArea2", d.v2);

    sparkline("sparkAmpLine1", "sparkAmpArea1", d.a1);
    sparkline("sparkAmpLine2", "sparkAmpArea2", d.a2);

    sparkline("sparkPowerLine1", "sparkPowerArea1", d.p1);
    sparkline("sparkPowerLine2", "sparkPowerArea2", d.p2);

    sparkline("sparkEnergyLine1", "sparkEnergyArea1", d.e1);
    sparkline("sparkEnergyLine2", "sparkEnergyArea2", d.e2);

    sparkline("sparkFreqLine1", "sparkFreqArea1", d.f1);
    sparkline("sparkFreqLine2", "sparkFreqArea2", d.f2);

    updateDashboardPressureValues(d);

    updatePressureGauges(
        Number(d.psi),
        Number(d.kg),
        Number(d.br)
    );
}

function updateElectrical(d) {
    updateElement("voltage", num(d.v1).toFixed(1));
    updateElement("current", num(d.a1).toFixed(2));
    updateElement("power", num(d.p1).toFixed(1));
    updateElement("frequency", num(d.f1).toFixed(1));
    updateElement("pf", num(d.pf1).toFixed(2));
    updateElement("_voltage", num(d.v2).toFixed(1));
    updateElement("_current", num(d.a2).toFixed(2));
    updateElement("_power", num(d.p2).toFixed(1));
    updateElement("_frequency", num(d.f2).toFixed(1));
    updateElement("_pf", num(d.pf2).toFixed(2));
    updateElement("energy1", num(d.e1).toFixed(1));
    updateElement("energy2", num(d.e2).toFixed(2));
}

function updatePressure(d) {
    gaugeUpdatePSI(num(d.psi));
    gaugeUpdateKG(num(d.kg));
}

function updateDashboardPressureValues(data) {
    updateElement('kalmanPressureValue', num(data.kPsi).toFixed(0));
    updateElement('nonKalmanPressure', num(data.nkPsi).toFixed(0));
    updateElement('psi', num(data.psi).toFixed(2));
    updateElement('kg', num(data.kg).toFixed(2));
}

window.addEventListener("load", () => {

    mqttStart();
});
