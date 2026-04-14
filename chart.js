"use strict";
let serverOffset = 0;
let lastServerTime = null;

window.activeDevice = localStorage.getItem("activeDevice") || null;
/* ========================================
   Full Pages
======================================== */
function initCardFullscreen() {

    document.querySelectorAll(".card").forEach(card => {

        card.addEventListener("click", (e) => {

            if (e.target.closest("button, .chart-tab")) return;

            const active = document.querySelector(".card-fullscreen");

            if (active && active !== card) {
                active.classList.remove("card-fullscreen");
                document.querySelector(".card-overlay")?.remove();
            }

            if (card.classList.contains("card-fullscreen")) {
                exitFullscreen(card);
            } else {
                enterFullscreen(card);
            }
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const active = document.querySelector(".card-fullscreen");
            if (active) exitFullscreen(active);
        }
    });

    function enterFullscreen(card) {
        const overlay = document.createElement("div");
        overlay.className = "card-overlay";
        overlay.onclick = () => exitFullscreen(card);
        document.body.appendChild(overlay);
        card.classList.add("card-fullscreen");
    }

    function exitFullscreen(card) {
        card.classList.remove("card-fullscreen");
        document.querySelector(".card-overlay")?.remove();
    }
}

function getDeviceChart(deviceId) {

    window.deviceCharts = window.deviceCharts || {};

    if (!window.deviceCharts[deviceId]) {
        window.deviceCharts[deviceId] = {
            c1: createChart(),
            c2: createChart(),
            c3: createChart()
        };
    }

    return window.deviceCharts[deviceId];
}

/* ========================================
   VOLTAGE CHART ENGINE (2 PZEM)
======================================== */
function updateChartLabels(chart, containerId) {

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    const now = lastServerTime ? new Date(lastServerTime) : new Date();
    const labels = [];

    const formatHour = (d) =>
        String(d.getHours()).padStart(2, "0") + ":00";

    const formatMinute = (d) =>
        String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0");

    if (chart.mode === "1D") {

        const base = getCurrentServerTime();
        base.setMilliseconds(0);

        for (let i = 5; i >= 0; i--) {
            const t = new Date(base - i * 10000);
            labels.push(
                String(t.getMinutes()).padStart(2, "0") + ":" +
                String(t.getSeconds()).padStart(2, "0")
            );
        }
    }

    if (chart.mode === "1M") {
        const base = new Date(now);
        base.setMinutes(0, 0, 0);

        for (let i = 5; i >= 0; i--) {
            const t = new Date(base - i * 3600000);
            labels.push(formatHour(t));
        }
    }

    if (chart.mode === "1W") {
        const base = new Date(now);
        base.setSeconds(0, 0);

        for (let i = 5; i >= 0; i--) {
            const t = new Date(base - i * 60000);
            labels.push(formatMinute(t));
        }
    }

    if (chart.mode === "1Y") {
        const base = new Date(now);
        base.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const t = new Date(base - i * 86400000);
            labels.push(
                t.getDate() + "/" + (t.getMonth() + 1)
            );
        }
    }

    labels.forEach(label => {
        const span = document.createElement("span");
        span.textContent = label;
        container.appendChild(span);
    });
}

function getCurrentServerTime() {
    return new Date(Date.now() + serverOffset);
}

function updateLiveDateTime() {

    const now = getCurrentServerTime();

    const days = [
        "Minggu", "Senin", "Selasa",
        "Rabu", "Kamis", "Jumat", "Sabtu"
    ];

    const dayName = days[now.getDay()];
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const time =
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":" +
        String(now.getSeconds()).padStart(2, "0");

    const dateEl = document.getElementById("liveDate");
    const clockEl = document.getElementById("liveClock");

    if (dateEl)
        dateEl.textContent = `${dayName}, ${date}/${month}/${year}`;

    if (clockEl)
        clockEl.textContent = time;
}

function createChart() {
    return {
        mode: "1D",
        raw: [],
        min: [],
        hour: [],
        day: []
    };
}

let lastSave = 0;
const CHART1 = createChart();
const CHART2 = createChart();
const CHART3 = createChart();

function pushVoltage(chart, v) {

    chart.raw.push({
        t: getCurrentServerTime().getTime(),
        v
    });

    trim(chart.raw, 600);

    if (!chart._m || Date.now() - chart._m > 60000) {
        chart._m = Date.now();
        chart.min.push(avg(chart.raw, 60));
        trim(chart.min, 10080);
    }

    if (!chart._h || Date.now() - chart._h > 3600000) {
        chart._h = Date.now();
        chart.hour.push(avg(chart.min, 60));
        trim(chart.hour, 720);
    }

    if (!chart._d || Date.now() - chart._d > 86400000) {
        chart._d = Date.now();
        chart.day.push(avg(chart.hour, 24));
        trim(chart.day, 365);
    }

}

function avg(arr, n) {
    const s = arr.slice(-n);
    return s.reduce((a, b) => a + (b.v ?? b), 0) / s.length || 0;
}

function trim(arr, max) {
    if (arr.length > max) arr.splice(0, arr.length - max);
}

function drawChart(chart, lineId, areaId, labelId, labelContainerId) {

    const lineEl = document.getElementById(lineId);
    const areaEl = document.getElementById(areaId);

    // jika chart tidak ada di halaman → stop
    if (!lineEl || !areaEl) return;

    const svg = lineEl.ownerSVGElement;
    if (!svg) return;

    let data;

    if (chart.mode === "1D") data = chart.raw.map(x => x.v);
    if (chart.mode === "1W") data = chart.min;
    if (chart.mode === "1M") data = chart.hour;
    if (chart.mode === "1Y") data = chart.day;

    const maxPoints = 60;
    const offset = chart.scrollOffset || 0;

    data = data.slice(-(maxPoints + offset), -offset || undefined);

    if (!data || data.length < 2) return;

    const width = svg.viewBox.baseVal.width;
    const height = svg.viewBox.baseVal.height;

    const minVolt = 150;
    const maxVolt = 260;

    const step = width / (maxPoints - 1);

    let line = "";
    let area = "";

    data.forEach((v, i) => {

        const x = i * step;
        const y = height - ((v - minVolt) / (maxVolt - minVolt)) * height;

        line += `${x},${y} `;
        area += `${x},${y} `;
    });

    if (labelContainerId)
        updateChartLabels(chart, labelContainerId);

    area += `${(data.length - 1) * step},200 0,200`;

    lineEl.setAttribute("points", line);
    areaEl.setAttribute("points", area);

    const labelGroup = document.getElementById(labelId);
    if (!labelGroup) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < data.length; i += 8) {

        const v = data[i];

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

        const x = i * step;
        const y = height - ((v - minVolt) / (maxVolt - minVolt)) * 150;

        text.setAttribute("x", x);
        text.setAttribute("y", y - 8);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "11");
        text.setAttribute("fill", "#ffffff");
        text.setAttribute("opacity", "0.8");

        text.textContent = v.toFixed(1);

        fragment.appendChild(text);
    }

    labelGroup.innerHTML = "";
    labelGroup.appendChild(fragment);
}

document.querySelectorAll(".chart-tab").forEach(btn => {
    btn.onclick = () => {

        const chartId = btn.dataset.chart;
        const mode = btn.dataset.mode;

        const container = btn.parentElement;
        container.querySelectorAll(".chart-tab")
            .forEach(x => x.classList.remove("active"));

        btn.classList.add("active");

        const charts = getDeviceChart(window.activeDevice);

        if (chartId === "1") {
            charts.c1.mode = mode;
            drawChart(charts.c1, "voltLine1", "voltArea1", "voltLabels1", "chartLabels1");
        }

        if (chartId === "2") {
            charts.c2.mode = mode;
            drawChart(charts.c2, "voltLine2", "voltArea2", "voltLabels2", "chartLabels2");
        }
        if (chartId === "3") {
            charts.c3.mode = mode;
            drawChart(charts.c3, "cmLine", "cmArea", "cmLabels", "chartLabels3");
        }
    }
});

function saveChartHistory() {

    const c1 = {
        min: CHART1.min,
        hour: CHART1.hour,
        day: CHART1.day
    };

    const c2 = {
        min: CHART2.min,
        hour: CHART2.hour,
        day: CHART2.day
    };

    const c3 = {
        min: CHART3.min,
        hour: CHART3.hour,
        day: CHART3.day
    };

    try {
        const id = window.activeDevice;
        localStorage.setItem(`c1_${id}`, JSON.stringify(c1));
        localStorage.setItem(`c2_${id}`, JSON.stringify(c2));
        localStorage.setItem(`c3_${id}`, JSON.stringify(c3));
    } catch (e) {
        console.warn("Storage penuh, reset history");
        localStorage.clear();
    }
}

function loadChartHistory() {

    const c1 = JSON.parse(localStorage.getItem("c1") || "null");
    const c2 = JSON.parse(localStorage.getItem("c2") || "null");
    const c3 = JSON.parse(localStorage.getItem("c3") || "null");

    if (c1) {
        CHART1.min = c1.min || [];
        CHART1.hour = c1.hour || [];
        CHART1.day = c1.day || [];
    }

    if (c2) {
        CHART2.min = c2.min || [];
        CHART2.hour = c2.hour || [];
        CHART2.day = c2.day || [];
    }

    if (c3) {
        CHART3.min = c3.min || [];
        CHART3.hour = c3.hour || [];
        CHART3.day = c3.day || [];
    }
}

function chartRenderLoop() {

    drawChart(CHART1, "voltLine1", "voltArea1", "voltLabels1", "chartLabels1");
    drawChart(CHART2, "voltLine2", "voltArea2", "voltLabels2", "chartLabels2");
    drawChart(CHART3, "cmLine", "cmArea", "cmLabels", "chartLabels3");

}

function enableChartZoomPan(svgId) {

    const svg = document.getElementById(svgId);
    if (!svg) return;

    let viewBox = svg.viewBox.baseVal;

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    svg.addEventListener("wheel", (e) => {

        e.preventDefault();

        const zoom = e.deltaY > 0 ? 1.1 : 0.9;

        const mx = e.offsetX / svg.clientWidth;
        const my = e.offsetY / svg.clientHeight;

        const newWidth = viewBox.width * zoom;
        const newHeight = viewBox.height * zoom;

        viewBox.x += (viewBox.width - newWidth) * mx;
        viewBox.y += (viewBox.height - newHeight) * my;

        viewBox.width = newWidth;
        viewBox.height = newHeight;

    });

    svg.addEventListener("mousedown", (e) => {

        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;

    });

    window.addEventListener("mousemove", (e) => {

        if (!isPanning) return;

        const dx = (e.clientX - startX) * viewBox.width / svg.clientWidth;
        const dy = (e.clientY - startY) * viewBox.height / svg.clientHeight;

        viewBox.x -= dx;
        viewBox.y -= dy;

        startX = e.clientX;
        startY = e.clientY;

    });

    window.addEventListener("mouseup", () => {
        isPanning = false;
    });

    svg.addEventListener("dblclick", () => {
        svg.setAttribute("viewBox", "0 0 600 200");
    });
}

function enableCrosshair(svgId, chart, textId, lineXId, lineYId) {

    const svg = document.getElementById(svgId);
    if (!svg) return;

    const lineX = document.getElementById(lineXId);
    const lineY = document.getElementById(lineYId);
    const text = document.getElementById(textId);

    if (!lineX || !lineY || !text) return;

    svg.addEventListener("mousemove", (e) => {

        const rect = svg.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        lineX.setAttribute("x1", x);
        lineX.setAttribute("x2", x);

        lineY.setAttribute("y1", y);
        lineY.setAttribute("y2", y);

        const data = chart.raw.map(v => v.v);

        const index = Math.floor((x / rect.width) * data.length);

        const value = data[index];

        if (value !== undefined) {

            text.setAttribute("x", x);
            text.setAttribute("y", y);

            text.textContent = value.toFixed(1) + " V";
        }
    });
}

function enableChartScroll(chart) {

    let offset = 0;

    window.addEventListener("wheel", (e) => {

        if (e.shiftKey) {

            offset += e.deltaY > 0 ? 10 : -10;

            offset = Math.max(0, offset);

            chart.scrollOffset = offset;

        }

    });

}

function updateChart(value, history, lineId, areaId) {

    history.push(value);

    if (history.length > 20)
        history.shift();

    // minimal 2 titik supaya step tidak rusak
    if (history.length < 2) return;

    const step = 200 / (history.length - 1);

    const minV = 210;
    const maxV = 235;

    let points = [];
    let areaPath = "";

    history.forEach((val, i) => {

        const x = i * step;

        const y = 35 - ((val - minV) / (maxV - minV)) * 20;

        points.push(`${x},${y}`);

        if (i === 0)
            areaPath += `M ${x} ${y}`;
        else
            areaPath += ` L ${x} ${y}`;

    });

    const lastX = (history.length - 1) * step;

    areaPath += ` L ${lastX} 40 L 0 40 Z`;

    document.getElementById(lineId)
        .setAttribute("points", points.join(" "));

    document.getElementById(areaId)
        .setAttribute("d", areaPath);
}

let sparkHistory = {};

function sparkline(lineId, areaId, value) {
    const lineEl = document.getElementById(lineId);
    const areaEl = document.getElementById(areaId);

    // jika elemen belum ada → stop
    if (!lineEl || !areaEl) return;

    if (!sparkHistory[lineId])
        sparkHistory[lineId] = [];

    const history = sparkHistory[lineId];

    history.push(value);

    if (history.length > 20)
        history.shift();

    if (history.length < 2) return;

    const step = 200 / (history.length - 1);

    const minV = Math.min(...history) - 1;
    const maxV = Math.max(...history) + 1;


    let points = [];
    let areaPath = "";

    history.forEach((val, i) => {

        const x = i * step;
        const y = 35 - ((val - minV) / (maxV - minV)) * 20;

        points.push(`${x},${y}`);

        if (i === 0)
            areaPath += `M ${x} ${y}`;
        else
            areaPath += ` L ${x} ${y}`;

    });

    const lastX = (history.length - 1) * step;

    areaPath += ` L ${lastX} 40 L 0 40 Z`;

    document.getElementById(lineId).setAttribute("points", points.join(" "));
    document.getElementById(areaId).setAttribute("d", areaPath);
}

// ================ Chart AquaMonitor End========================//

window.addEventListener("load", () => {
    setInterval(updateLiveDateTime, 1000);
    // initCardFullscreen();
    loadChartHistory();
    setInterval(saveChartHistory, 5000);
    setInterval(() => {
        if (!window.activeDevice) return;

        const charts = getDeviceChart(window.activeDevice);

        drawChart(charts.c1, "voltLine1", "voltArea1", "voltLabels1", "chartLabels1");
        drawChart(charts.c2, "voltLine2", "voltArea2", "voltLabels2", "chartLabels2");
        drawChart(charts.c3, "cmLine", "cmArea", "cmLabels", "chartLabels3");

    }, 2000);
    enableChartZoomPan("voltChart1");
    enableChartZoomPan("voltChart2");
    enableChartZoomPan("cmChart");
    enableCrosshair(
        "voltChart1",
        getDeviceChart(window.activeDevice).c1,
        "crosshairText1",
        "crosshairX1",
        "crosshairY1"
    );

    enableCrosshair(
        "voltChart2",
        getDeviceChart(window.activeDevice).c2,
        "crosshairText2",
        "crosshairX2",
        "crosshairY2"
    );

    enableCrosshair(
        "cmChart",
        getDeviceChart(window.activeDevice).c3,
        "crosshairText3",
        "crosshairX3",
        "crosshairY3"
    );

});