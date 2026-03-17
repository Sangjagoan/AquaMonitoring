
"use strict";
window.devices = window.devices || {};
window.activeDevice = window.activeDevice || null;

const devices = window.devices;
function num(v) {
    return Number(v) || 0;
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

    // skip kalau bukan device valid
    if (!deviceId.startsWith("ESP32_")) return;

    // =========================
    // DATA
    // =========================
    if (type === "data") {

        if (!devices[deviceId]) {
            devices[deviceId] = {};
        }

        devices[deviceId] = data;

        if (!window.activeDevice) {
            window.activeDevice = deviceId;
        }

        if (deviceId !== window.activeDevice) return;

        console.log("ALL DEVICES:", devices);

        updateAquaBars(data.lvl, data.tAir, data.jar);
        updateElectrical(data);

        sparkline("sparkVoltLine1", "sparkVoltArea1", data.v1);
        sparkline("sparkVoltLine2", "sparkVoltArea2", data.v2);
        sparkline("sparkAmpLine1", "sparkAmpArea1", data.a1);
        sparkline("sparkAmpLine2", "sparkAmpArea2", data.a1);

        sparkline("sparkPowerLine1", "sparkPowerArea1", data.p1);
        sparkline("sparkPowerLine2", "sparkPowerArea2", data.p2);

        sparkline("sparkEnergyLine1", "sparkEnergyArea1", data.e1);
        sparkline("sparkEnergyLine2", "sparkEnergyArea2", data.e2);

        sparkline("sparkFreqLine1", "sparkFreqArea1", data.f1);
        sparkline("sparkFreqLine2", "sparkFreqArea2", data.f2);

        pushVoltage(CHART1, data.v1);
        pushVoltage(CHART2, data.v2);
        pushVoltage(CHART3, data.tAir);

        chartRenderLoop();

        pushPressureCandle(PSI_CANDLE, data.psi);
        pushPressureCandle(KG_CANDLE, data.kg);

        drawPressureCandles(PSI_CANDLE, "pressurePsiChart");
        drawPressureCandles(KG_CANDLE, "pressureKgChart");

        updateDashboardPressureValues(data);

        updatePressureGauges(
            Number(data.psi),
            Number(data.kg),
            Number(data.br)
        );
    }

    // =========================
    // INDIKATOR
    // =========================
    if (type === "state") {

        if (!devices[deviceId]) devices[deviceId] = {};
        devices[deviceId].indikator = data;

        if (deviceId !== window.activeDevice) return;

        setLed("ledTutup", data.ot);
        setLed("ledBuka", data.ob);
        
        console.log(" STATE:", data);
    }

    // =========================
    // UPTIME
    // =========================
    if (type === "uptime") {

        const d = typeof data === "string" ? JSON.parse(data) : data;

        if (!devices[deviceId]) devices[deviceId] = {};
        devices[deviceId].uptime = d;

        if (deviceId !== window.activeDevice) return;

        updateElement("uptime", formatUptime(d.up));
        console.log(" UPTIME:", data);
    }
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
    updateElement('kalmanPressureValue', data.kPsi.toFixed(0));
    updateElement('nonKalmanPressure', data.nkPsi.toFixed(0));
    updateElement('psi', data.psi.toFixed(2));
    updateElement('kg', data.kg.toFixed(2));
}

window.addEventListener("load", () => {

    mqttStart();
});
