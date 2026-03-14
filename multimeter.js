'use strict';
/*
* TESLA HUD BY Tameem Imamdad timamdad@hawk.iit.edu
*/

let dev = false;
//let t0 = 0;
//let t1 = 0;

function drawMeterOn(canvasId, voltage, amper, rpm, topSpeed) {

    const c = document.getElementById(canvasId);
    if (!c) return;

    const ctx = c.getContext("2d");

    c.width = 520;
    c.height = 520;

    ctx.clearRect(0, 0, 500, 500);

    drawMeter(voltage, amper, rpm, topSpeed, ctx);
}

// rpmGradient.addColorStop(1, '#EF4836');

function voltageNeedle(ctx, rotation) {
    ctx.lineWidth = 2;

    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(rotation);
    ctx.strokeRect(-130 / 2 + 170, -1 / 2, 135, 1);
    ctx.restore();

    rotation += Math.PI / 180;
}

function rpmNeedle(ctx, rotation) {
    ctx.lineWidth = 2;

    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(rotation);
    ctx.strokeRect(-130 / 2 + 170, -1 / 2, 135, 1);
    ctx.restore();

    rotation += Math.PI / 180;
}

function drawMiniNeedle(ctx, rotation, width, voltage) {
    ctx.lineWidth = width;

    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(rotation);
    ctx.strokeStyle = "#333";
    ctx.fillStyle = "#333";
    ctx.strokeRect(-20 / 2 + 220, -1 / 2, 20, 1);
    ctx.restore();

    let x = (250 + 180 * Math.cos(rotation));
    let y = (250 + 180 * Math.sin(rotation));

    ctx.font = "20px MuseoSans_900-webfont";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(voltage, x, y);
}

function calculateSpeedAngle(x, a, b) {
    let degree = (a - b) * (x) + b;
    let radian = (degree * Math.PI) / 180;
    return radian <= 1.45 ? radian : 1.45;
}

function calculateRPMAngel(x, a, b) {
    let degree = (a - b) * (x) + b;
    let radian = (degree * Math.PI) / 180;
    return radian >= -0.46153862656807704 ? radian : -0.46153862656807704;
}

function drawMeter(voltage, amper, rpm, topSpeed, ctx) {
    if (voltage == undefined) {
        return false;
    } else {
        voltage = Math.floor(voltage);
        rpm = rpm;
    }

    const voltageGradient = ctx.createLinearGradient(0, 500, 0, 0);
    voltageGradient.addColorStop(0, '#fe0000');
    voltageGradient.addColorStop(1, '#b66f35');

    const rpmGradient = ctx.createLinearGradient(0, 500, 0, 0);
    rpmGradient.addColorStop(0, '#9c06f9');
    rpmGradient.addColorStop(1, '#fc1a1a');
    ctx.clearRect(0, 0, 500, 500);

    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.arc(250, 250, 240, 0, 2 * Math.PI);
    ctx.fill();
    ctx.save()
    ctx.restore();
    ctx.fillStyle = "#FFF";
    ctx.stroke();

    // 🔵 BARU GAMBAR SKALA
    for (let i = 20; i <= topSpeed; i += 20) {

        drawMiniNeedle(
            ctx,
            calculateSpeedAngle(i / topSpeed, 83.07888, 34.3775) * Math.PI,
            3,
            i
        );

    }


    ctx.beginPath();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 10;
    ctx.arc(250, 250, 100, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.arc(250, 250, 240, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.font = "70px MuseoSans_900-webfont";
    ctx.textAlign = "center";
    ctx.fillText(voltage, 250, 220);

    ctx.font = "30px MuseoSans_900-webfont";
    ctx.fillText("Volt", 250, 255);

    ctx.fillStyle = "#999";
    ctx.font = "70px MuseoSans_900-webfont";
    ctx.fillText(amper, 250, 460);

    ctx.fillStyle = "#FFF";

    ctx.beginPath();
    ctx.strokeStyle = "#41dcf4";
    ctx.lineWidth = 25;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00c6ff";

    ctx.strokeStyle = voltageGradient;
    ctx.arc(250, 250, 228, .6 * Math.PI, calculateSpeedAngle(voltage / topSpeed, 83.07888, 34.3775) * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 25;
    ctx.strokeStyle = rpmGradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#f7b733";

    ctx.arc(250, 250, 228, .4 * Math.PI, calculateRPMAngel(rpm / 4.7, 0, 22.9183) * Math.PI, true);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#41dcf4';
    voltageNeedle(ctx, calculateSpeedAngle(voltage / topSpeed, 83.07888, 34.3775) * Math.PI);

    ctx.strokeStyle = rpmGradient;
    rpmNeedle(ctx, calculateRPMAngel(rpm / 4.7, 0, 22.9183) * Math.PI);

    ctx.strokeStyle = "#000";
}

document.addEventListener('DOMContentLoaded', function () {

    //setInterval(setSpeed, 100)
    //renderCanvas();
    // drawMeterOn("meter1", data.v1, data.f1, data.f1, 260);
    // drawMeterOn("meter2", data.v2, data.f2, data.f2, 260);
}, false);
