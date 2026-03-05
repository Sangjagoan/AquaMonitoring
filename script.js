
"use strict";
let redrawCounter = 0;
function num(v) {
    return Number(v) || 0;
}

function updateElement(id, value) {

    const el = document.getElementById(id);

    if (!el) {
        console.warn("ELEMENT TIDAK ADA:", id);
        return;
    }

    el.textContent = value;
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
        ubdatedashboardPressureValues(data);
        // =========================
        // PRESSURE GAUGE
        // =========================
        updatePressureGauges(
            Number(data.psi),
            Number(data.kg)

        );
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
}

function updatePressure(d) {
    gaugeUpdatePSI(num(d.psi));
    gaugeUpdateKG(num(d.kg));
}

function ubdatedashboardPressureValues(data) {
    updateElement('kalmanPressureValue', data.kPsi.toFixed(0));
    updateElement('nonKalmanPressure', data.nkPsi.toFixed(0));
    updateElement('psi', data.psi.toFixed(2));
    updateElement('kg', data.kg.toFixed(2));
}


window.addEventListener("load", () => {
    mqttStart();
});
