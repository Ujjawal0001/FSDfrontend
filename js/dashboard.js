 function openProfile(){
  const userId = localStorage.getItem("userId");
  window.location.href = "profile.html?userId=" + userId;
}
  let latestWeather = null;
async function loadWeather(city = "Delhi") {
  const box = document.getElementById("weatherBox");

  try {
    const res = await fetch(`http://localhost:5000/api/weather/${city}`);
    
    const data = await res.json();
    latestWeather = data.list;

    box.innerHTML = "";

    // 🌱 FALLBACK if API fails
    if (!data || !data.list || data.list.length === 0) {
      box.innerHTML = "🌦 Weather data not available (demo mode)";

      // demo UI so dashboard never looks empty
      box.style.display = "grid";
      box.style.gridTemplateColumns = "repeat(7,1fr)";
      box.style.gap = "10px";

      for (let i = 0; i < 7; i++) {
        box.innerHTML += `
          <div class="card" style="text-align:center">
            <h4>Day ${i + 1}</h4>
            <div style="font-size:28px">☀️</div>
            <p>30°C</p>
          </div>
        `;
      }
      return;
    }

    // GROUP BY DATE
    const daily = {};

    data.list.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      if (!daily[date]) daily[date] = [];
      daily[date].push(item);
    });

    const dates = Object.keys(daily);
    if (dates.length === 0) {
      box.innerHTML = "No grouped weather data";
      return;
    }

    // NEXT 7 DAYS
    const next7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      next7Days.push(d.toISOString().split("T")[0]);
    }

    box.style.display = "grid";
    box.style.gridTemplateColumns = "repeat(7,1fr)";
    box.style.gap = "10px";

    next7Days.forEach((date, index) => {

      let dayData = daily[date];

      // SAFE FALLBACK
      if (!dayData || dayData.length === 0) {
        dayData = daily[next7Days[index - 1]] || daily[dates[0]];
      }

      if (!dayData || dayData.length === 0) return;

      const dayName = new Date(date)
        .toLocaleDateString("en-IN", { weekday: "short" });

      // AVG TEMP
      let avgTemp = 0;
      dayData.forEach(d => avgTemp += d.main.temp);
      avgTemp = (avgTemp / dayData.length).toFixed(1);

      // WEATHER TYPE
      let isRain = false;

      dayData.forEach(d => {
        const w = d.weather[0].main.toLowerCase();
        if (w.includes("rain") || w.includes("drizzle")) {
          isRain = true;
        }
      });

      let icon = "☀️";
      const mainWeather = dayData[0].weather[0].main.toLowerCase();

      if (isRain) icon = "🌧️";
      else if (mainWeather.includes("cloud")) icon = "☁️";

      box.innerHTML += `
        <div class="card" style="text-align:center">
          <h4>${dayName}</h4>
          <div style="font-size:28px">${icon}</div>
          <p>${avgTemp}°C</p>
        </div>
      `;
    });

  } catch (err) {
    console.log("Weather Error:", err);

    // 💡 HARD FALLBACK UI
    box.innerHTML = "⚠ Weather system offline";

    box.style.display = "grid";
    box.style.gridTemplateColumns = "repeat(7,1fr)";
    box.style.gap = "10px";

    for (let i = 0; i < 7; i++) {
      box.innerHTML += `
        <div class="card" style="text-align:center">
          <h4>Day ${i + 1}</h4>
          <div style="font-size:28px">☀️</div>
          <p>--°C</p>
        </div>
      `;
    }
  }
}
function scrollTo(id){
  document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
}
function updateSensorStatus(){
  document.getElementById("s_temp").innerText = "🟢 Active";
  document.getElementById("s_hum").innerText = "🟢 Active";
  document.getElementById("s_soil").innerText = "🟢 Active";
}
let chart;

window.onload = () => {
  const ctx = document.getElementById("chart");

 chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperature (°C)",
        data: [],
        borderColor: "#ff4d4d",
        backgroundColor: "rgba(255,77,77,0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 2
      },
      {
        label: "Humidity (%)",
        data: [],
        borderColor: "#4da6ff",
        backgroundColor: "rgba(77,166,255,0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 2
      },
      {
        label: "Soil Moisture (%)",
        data: [],
        borderColor: "#33cc66",
        backgroundColor: "rgba(51,204,102,0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 2
      }
    ]
  },

  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)"
        }
      }
    }
  }
});

  updateSensorStatus(); // 👈 ADD THIS
  loadData();
  loadAlerts();
  loadWeather();
  loadCrops();
  setInterval(loadData,3000);
};
let crops = []; // global

async function loadCrops(){

  const userId = new URLSearchParams(window.location.search).get("userId");

  if(!userId){
    console.log("No userId");
    return;
  }

  try{
    const res = await fetch(`http://localhost:5000/api/crops/${userId}`);

    if(!res.ok){
      throw new Error("Failed to fetch crops");
    }

    const data = await res.json();

    crops = data; // ✅ store globally

    const box = document.getElementById("cropBox");
    box.innerHTML = "";

    if(!Array.isArray(data) || data.length === 0){
      box.innerHTML = "<p>No crops added</p>";
      return;
    }

    data.forEach(crop => {
      box.innerHTML += `
        <div class="card">
          <h4>🌾 ${crop.name}</h4>

          <p>💧 Ideal Moisture: ${crop.idealMoisture}%</p>
          <p>🌡 Ideal Temp: ${crop.idealTemp}°C</p>

       
          <button onclick="deleteCrop('${crop._id}')">❌ Delete</button>
        </div>
      `;
    });

  }catch(err){
    console.log("LoadCrops Error:", err);
    document.getElementById("cropBox").innerHTML =
      "<p>⚠ Failed to load crops</p>";
  }
}

 // ✅ GLOBAL
function updateCropMonitoring(d){

  const box = document.getElementById("cropBox");
  box.innerHTML = "";

  // ❗ No crops case
  if(!crops || crops.length === 0){
    box.innerHTML = "<div class='rec'>No crops added</div>";
    return;
  }

  crops.forEach(crop => {

    let status = "Healthy";
    let color = "green";
    let alertMsg = "";

    // 🌱 SOIL CHECK
    if(d.soilMoisture < crop.idealMoisture - 15){
      status = "Dry";
      color = "red";
      alertMsg = "💧 Immediate irrigation needed";
    }
    else if(d.soilMoisture < crop.idealMoisture - 5){
      status = "Low Moisture";
      color = "orange";
    }

    // 🌡 TEMP CHECK (override if worse)
    if(d.temperature > crop.idealTemp + 8){
      status = "Heat Stress";
      color = "red";
      alertMsg = "🔥 High temperature stress";
    }
    else if(d.temperature > crop.idealTemp + 3 && status !== "Dry"){
      status = "Warm";
      color = "orange";
    }

    // 🧠 FINAL CARD
    box.innerHTML += `
      <div class="card">

        <h4>🌾 ${crop.name}</h4>

        <p>🌡 Current Temp: ${d.temperature}°C</p>
        <p>💧 Soil Moisture: ${d.soilMoisture}%</p>

        <p>
          Status:
          <b style="color:${color}">${status}</b>
        </p>

        ${
          alertMsg
          ? `<div class="alert">⚠ ${alertMsg}</div>`
          : `<div class="rec">✅ Conditions are good</div>`
        }

        <div style="margin-top:10px;">
           
          <button onclick='deleteCrop("${crop._id}")'>❌ Delete</button>
        </div>

      </div>
    `;
  });
}
let currentCropId = null;

async function openEditById(id){

  try{
    currentCropId = id;

    // 🔹 Fetch crop from backend
    const res = await fetch(`http://localhost:5000/api/crops/${id}`);
    const crop = await res.json();

    if(!crop){
      alert("Crop not found");
      return;
    }

    // 🔹 Show edit box
    document.getElementById("editCropBox").style.display = "block";

    // 🔹 Fill values
    document.getElementById("editName").value = crop.name || "";
    document.getElementById("editMoisture").value = crop.idealMoisture || "";
    document.getElementById("editTemp").value = crop.idealTemp || "";

  }catch(err){
    console.log("Edit load error:", err);
  }
}
async function addCrop(){

  const userId = new URLSearchParams(window.location.search).get("userId");

  const name = document.getElementById("cropName").value.trim();
  const moisture = document.getElementById("cropMoisture").value;
  const temp = document.getElementById("cropTemp").value;

  if(!name){
    alert("Enter crop name");
    return;
  }

  try{
    const res = await fetch("http://localhost:5000/api/crops",{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,   // ✅ correct
        name,
        idealMoisture: Number(moisture),
        idealTemp: Number(temp)
      })
    });

    const data = await res.json();

    if(data.success){
      alert("✅ Crop Added");

      document.getElementById("cropName").value = "";
      document.getElementById("cropMoisture").value = "";
      document.getElementById("cropTemp").value = "";

      loadCrops();
    }else{
      alert("❌ Failed");
    }

  }catch(err){
    console.log(err);
  }
}
async function deleteCrop(id){

  if(!id){
    alert("Invalid crop ID");
    return;
  }

  if(!confirm("Delete this crop?")) return;

  try{
    const res = await fetch(`http://localhost:5000/api/crops/${id}`,{
      method: "DELETE"
    });

    const data = await res.json();

    if(data.success){
      alert("✅ Deleted");
      loadCrops();   // refresh crops
      loadData();    // refresh UI
    }else{
      alert("❌ Delete failed");
    }

  }catch(err){
    console.log("Delete Error:", err);
  }
}
async function editCrop(crop){

  const name = prompt("Name", crop.name);
  const moisture = prompt("Moisture", crop.idealMoisture);
  const temp = prompt("Temp", crop.idealTemp);

  await fetch(`http://localhost:5000/api/crops/update/${crop._id}`,{
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      name,
      idealMoisture: moisture,
      idealTemp: temp
    })
  });

  loadCrops();
}
async function updateCrop(){

  try{

    if(!currentCropId){
      alert("No crop selected");
      return;
    }

    const name = document.getElementById("editName").value.trim();
    const moisture = document.getElementById("editMoisture").value;
    const temp = document.getElementById("editTemp").value;

    // ✅ VALIDATION
    if(!name || !moisture || !temp){
      alert("All fields required");
      return;
    }

    const payload = {
      name: name,
      idealMoisture: Number(moisture),
      idealTemp: Number(temp)
    };

    const res = await fetch(
      `http://localhost:5000/api/crops/update/${currentCropId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    if(data.success){
      alert("✅ Crop updated");

      closeEdit();   // hide edit box
      loadCrops();   // reload crop list
    }else{
      alert("❌ Update failed");
    }

  }catch(err){
    console.log("Update error:", err);
    alert("⚠ Server error");
  }
}
function closeEdit(){
  document.getElementById("editCropBox").style.display = "none";
}
async function loadAlerts(){

  const params = new URLSearchParams(window.location.search);
const urlId = params.get("userId");

const userId = urlId || localStorage.getItem("userId");

  const res = await fetch(`http://localhost:5000/api/alerts/${userId}`);
  const data = await res.json();

  const box = document.getElementById("farmerAlerts");
  box.innerHTML = "";

  data.forEach(a => {
   box.innerHTML += `
      <div class="alert">
        ⚠ ${a.message}

        <button onclick="deleteAlert('${a._id}')" 
          style="margin-left:10px;background:red;color:white;border:none;padding:4px 8px;border-radius:5px;cursor:pointer;">
          DELETE
        </button>
      </div>
    `;
  });
}
async function deleteAlert(id){

  if(!confirm("Delete this alert?")) return;

  try{
    const res = await fetch(`http://localhost:5000/api/alerts/${id}`,{
      method:"DELETE"
    });

    const data = await res.json();

    if(data.success){
      loadAlerts(); // refresh
    }else{
      alert("Delete failed");
    }

  }catch(err){
    console.log("Delete alert error:", err);
  }
}
let latestData = null;

async function loadData(){

  const params = new URLSearchParams(window.location.search);
const urlId = params.get("userId");

const userId = urlId || localStorage.getItem("userId");

  if(!userId){
    console.log("No userId");
    return;
  }

  try{
    const res = await fetch(`http://localhost:5000/api/data/${userId}`);
    const data = await res.json();

    if(!data || data.length === 0){
      console.log("No sensor data");
      return;
    }

    const d = data[0];
    latestData = d;

    // ✅ UI UPDATE
    document.getElementById("temp").innerText = d.temperature;
    document.getElementById("hum").innerText = d.humidity;
    document.getElementById("soil").innerText = d.soilMoisture;

    const water = (100 - d.soilMoisture) * 10;
    document.getElementById("water").innerText = `${water}L/day`;

    // ✅ SENSOR STATUS
    updateSensorStatus();
    document.getElementById("lastUpdate").innerText =
      new Date().toLocaleTimeString();

      // ✅ FEATURES
      updateChart(d);
      updateCropMonitoring(d);
      aiRec(d, latestWeather);
      
      // (optional depending on your setup)
      loadAlerts();
     
     

  }catch(err){
    console.log("LoadData Error:", err);

    // 🔴 show offline status
    document.getElementById("s_temp").innerText = "🔴 Offline";
    document.getElementById("s_hum").innerText = "🔴 Offline";
    document.getElementById("s_soil").innerText = "🔴 Offline";
  }
}
function updateChart(d){
  const t = new Date().toLocaleTimeString();

  chart.data.labels.push(t);
  chart.data.datasets[0].data.push(d.temperature);
  chart.data.datasets[1].data.push(d.humidity);
  chart.data.datasets[2].data.push(d.soilMoisture);

  if(chart.data.labels.length>15){
    chart.data.labels.shift();
    chart.data.datasets.forEach(ds=>ds.data.shift());
  }

  chart.update();
}

function aiRec(d, weather){

  const box = document.getElementById("recBox");
  const alertBox = document.getElementById("alertList");

  if(!box) return; // safety check

  box.innerHTML = "";

  if(alertBox){
    alertBox.innerHTML = "";
  }

  const water = Math.round((100 - d.soilMoisture) * 10);

  let rain = false;

  if(weather){
    rain = weather.some(w =>
      w.weather[0].main.toLowerCase().includes("rain")
    );
  }

  let alertAdded = false;

  if(rain){
    box.innerHTML += `<div class="rec">⛔ Rain expected → Skip irrigation</div>`;
    if(alertBox) alertBox.innerHTML += `<div class="alert">🌧 Rain Alert</div>`;
    alertAdded = true;
  }

  if(d.soilMoisture < 30){
    box.innerHTML += `<div class="rec">💧 Irrigate now (${water} L)</div>`;
    if(alertBox) alertBox.innerHTML += `<div class="alert">🚨 Dry Soil</div>`;
    alertAdded = true;
  }

  if(d.temperature > 40){
    box.innerHTML += `<div class="rec">🔥 High temp → More water</div>`;
    if(alertBox) alertBox.innerHTML += `<div class="alert">🔥 Heat Alert</div>`;
    alertAdded = true;
  }

  if(!alertAdded){
    box.innerHTML += `<div class="rec">🌱 Conditions normal</div>`;
    if(alertBox) alertBox.innerHTML = `<div class="rec">✅ No alerts</div>`;
  }
}