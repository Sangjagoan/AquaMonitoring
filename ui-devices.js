function renderDevices() {

    const container = document.getElementById("devices");
    if (!container) return;

    let html = "";

    for (const id in window.devices) {

        const d = window.devices[id];

        html += `
            <div class="card">
                <h3>${id}</h3>
                <p>Pressure: ${d.kg ?? '-'}</p>
                <p>Level: ${d.lvl ?? '-'}</p>
            </div>
        `;
    }

    container.innerHTML = html;
}