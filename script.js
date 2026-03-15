
"use strict";
let redrawCounter = 0;
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
    if (topic === "esp32/panel/data") {
        console.log("MQTT RX:", topic, data);
        updateAquaBars(data.lvl, data.tAir, data.jar);
        // CHART ENGINE
        updateElectrical(data);
        pushVoltage(CHART1, data.v1);
        pushVoltage(CHART2, data.v2);
        pushVoltage(CHART3, data.tAir);
        chartRenderLoop(); // render langsung
        // =========================
        // PRESSURE CANDLE
        // =========================
        pushPressureCandle(PSI_CANDLE, (data.psi));
        pushPressureCandle(KG_CANDLE, (data.kg));

        drawPressureCandles(PSI_CANDLE, "pressurePsiChart");
        drawPressureCandles(KG_CANDLE, "pressureKgChart");
        updateDashboardPressureValues(data);
        // =========================
        // PRESSURE GAUGE
        // =========================
        updatePressureGauges(
            Number(data.psi),
            Number(data.kg),
            Number(data.br)

        );
    }

    if (topic === "esp32/indikator/state") {
        const hb = data;

        setLed("ledTutup", hb.ot);
        setLed("ledBuka", hb.ob);

        console.log("Indikator Led:", data);
    }

    if (topic === "esp32/config/uptime") {

        console.log("UPTIME:", topic, data);

        const d = typeof data === "string" ? JSON.parse(data) : data;

        updateElement("uptime", formatUptime(d.up));

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
