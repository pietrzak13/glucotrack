let isLogged = true;
let editIndex = -1;
let measurements = [];

// Pobieranie danych z LocalStorage (z obsługą błędów)
try {
    const savedData = localStorage.getItem("sugarData");
    measurements = savedData ? JSON.parse(savedData) : [];
} catch (e) {
    measurements = [];
}

const form = document.getElementById("sugar-form");
const tableBody = document.querySelector("#table tbody");
const chartCanvas = document.getElementById("chart");

// 2. Funkcja ustawiająca datę i godzinę (format HTML5)
function setNow() {
    const teraz = new Date();
    const rok = teraz.getFullYear();
    const miesiac = String(teraz.getMonth() + 1).padStart(2, '0');
    const dzien = String(teraz.getDate()).padStart(2, '0');
    const godzina = String(teraz.getHours()).padStart(2, '0');
    const minuta = String(teraz.getMinutes()).padStart(2, '0');

    document.getElementById("date").value = `${rok}-${miesiac}-${dzien}`;
    document.getElementById("time").value = `${godzina}:${minuta}`;
}

// 3. Rysowanie wykresu na Canvas
function renderChart() {
    const ctx = chartCanvas.getContext("2d");
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    if (measurements.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = "#3b2b25";
    ctx.lineWidth = 3;

    measurements.forEach((m, i) => {
        const x = (chartCanvas.width / (measurements.length - 1)) * i;
        const y = chartCanvas.height - (m.level * (chartCanvas.height / 300));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

// 4. Wyświetlanie tabeli z oceną medyczną
function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    let total = 0;

    measurements.forEach((m, index) => {
        let status = "Norma";
        let color = "green";
        let momentPL = "Nieokreślony";

        if (m.type === "fasting") {
            momentPL = "Na czczo";
            if (m.level < 70) { status = "Niedocukrzenie"; color = "#006994"; }
            else if (m.level >= 100 && m.level <= 125) { status = "Stan przedcukrzycowy"; color = "#ff7f00"; }
            else if (m.level >= 126) { status = "Cukrzyca (wymagająca potwierdzenia)"; color = "#950606"; }
        } else if (m.type === "after-meal") {
            momentPL = "Po posiłku";
            if (m.level < 70) { status = "Niedocukrzenie"; color = "#006994"; }
            else if (m.level >= 140 && m.level <= 199) { status = "Stan przedcukrzycowy"; color = "#ff7f00"; }
            else if (m.level >= 200) { status = "Cukrzyca (wymagająca potwierdzenia)"; color = "#950606"; }
        } else {
            momentPL = "Przed snem";
            if (m.level < 70) { status = "Niedocukrzenie"; color = "#006994"; }
            else if (m.level >= 140 && m.level <= 199) { status = "Stan przedcukrzycowy"; color = "#ff7f00"; }
            else if (m.level >= 200) { status = "Cukrzyca (wymagająca potwierdzenia)"; color = "#950606"; }
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${m.date}</td>
            <td>${m.time}</td>
            <td>${momentPL}</td>
            <td>${m.level} mg/dL</td>
            <td style="color: ${color}; font-weight: bold;">${status}</td>
            <td>
                <button onclick="edytujPomiar(${index})" style="background:#006994; color:white; border:none; border-radius:5px; padding: 5px; cursor:pointer;">Edytuj</button>
                <button onclick="usunPomiar(${index})" style="background:#950606; color:white; border:none; border-radius:5px; padding: 5px; cursor:pointer;">Usuń</button>
            </td>
        `;
        tableBody.appendChild(row);
        total += m.level;
    });

    // Aktualizacja średniej
    const avgDisplay = document.getElementById("average-info");
    if (avgDisplay) {
        let avg = measurements.length > 0 ? (total / measurements.length).toFixed(1) : 0;
        avgDisplay.innerText = "Średnia z pomiarów: " + avg + " mg/dL";
    }
    renderChart();
}

window.edytujPomiar = function(index) {
    const p = measurements[index];
    document.getElementById("level").value = p.level;
    document.getElementById("date").value = p.date;
    document.getElementById("time").value = p.time;
    document.getElementById("type").value = p.type || "fasting";
    
    editIndex = index;
    form.querySelector("button").innerText = "Zaktualizuj wynik";
    document.getElementById("app").scrollIntoView();
};

window.usunPomiar = function(index) {
    if (confirm("Czy na pewno chcesz usunąć ten pomiar?")) {
        measurements.splice(index, 1);
        localStorage.setItem("sugarData", JSON.stringify(measurements));
        renderTable();
    }
};

form.addEventListener("submit", function(e) {
    e.preventDefault();

    if (!isLogged) {
        alert("Zaloguj się najpierw!");
        return;
    }

    const lvl = Number(document.getElementById("level").value);
    const dt = document.getElementById("date").value;
    const tm = document.getElementById("time").value;
    const tp = document.getElementById("type").value;

    if (lvl <= 0 || lvl > 1000) {
        alert("Wprowadź prawidłową wartość (1-1000)!");
        return;
    }

    const nowyObiekt = { level: lvl, date: dt, time: tm, type: tp };

    if (editIndex === -1) {
        measurements.push(nowyObiekt);
    } else {
        measurements[editIndex] = nowyObiekt;
        editIndex = -1;
        form.querySelector("button").innerText = "Zapisz";
    }

    localStorage.setItem("sugarData", JSON.stringify(measurements));
    form.reset();
    setNow();
    renderTable();
});

setNow();
renderTable();