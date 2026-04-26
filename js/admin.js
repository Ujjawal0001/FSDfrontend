let chart;
function adminLogout(){
  localStorage.removeItem("adminToken"); // remove admin login
  window.location.href = "login.html";   // redirect to login
}
// ✅ SINGLE INIT (FIXED)
window.onload = () => {
  initChart();
  loadFarmers();
  loadWeather();

  setInterval(loadFarmers,3000);
};

// ---------------- FARMERS ----------------
async function loadFarmers(){
  try{
    const res = await fetch("http://127.0.0.1:5000/api/data/all");

    if(!res.ok) throw new Error("Server error");

    const data = await res.json();

    if(!Array.isArray(data)) return;

    const container = document.getElementById("farmers");
    const alertBox = document.getElementById("alerts");
    const recBox = document.getElementById("recs");

    container.innerHTML = "";
    alertBox.innerHTML="";
    recBox.innerHTML="";

    let temps=[], soils=[], labels=[];

    latestSensor = data.length ? data[0] : null;

    data.forEach(d => {

      container.innerHTML += `
       <div class="card">
      <h3>🌾 ${d.userId}</h3>

      <p>🏡 ${d.farmName || "N/A"}</p>
      <p>📍 ${d.location || "N/A"}</p>
      <p>🌱 ${d.crops?.length ? d.crops.join(", ") : "No crops"}</p>
      <p>📏 ${d.landSize || "N/A"} acres</p>

      <hr>

      <p>🌡 ${d.temperature}°C</p>
      <p>💧 ${d.humidity}%</p>
      <p>🌱 ${d.soilMoisture}%</p>

      <button onclick="openFarm('${d.userId}')">👁 View</button>
      <button onclick="editFarmer('${d.userId}')">✏️ Edit</button>
      <button onclick="deleteFarmer('${d.userId}')">❌ Delete</button>
    </div>
      `;

      if(d.temperature > 40){
        alertBox.innerHTML += `<div class="alert">🔥 ${d.userId} High Temp</div>`;
      }

      if(d.soilMoisture < 30){
        alertBox.innerHTML += `<div class="alert">🚨 ${d.userId} Dry Soil</div>`;
      }

      if(d.soilMoisture < 40){
        recBox.innerHTML += `<div class="rec">💧 Irrigate ${d.userId}</div>`;
      }

      labels.push(d.userId);
      temps.push(d.temperature);
      soils.push(d.soilMoisture);
    });

    updateChart(labels,temps,soils);

  }catch(err){
    console.log("LoadFarmers Error:", err);
  }
}
// ---------------- WEATHER ----------------
let weatherChart;
let latestSensor = null;
async function loadWeather(city="Delhi"){

  try{
    const res = await fetch(`http://localhost:5000/api/weather/${city}`);
    const data = await res.json();

    const box = document.getElementById("weatherBox");
    const rainBox = document.getElementById("rainAlerts");

    box.innerHTML = "";
    rainBox.innerHTML = "";

    if(!data.list){
      box.innerHTML = "No weather data";
      return;
    }

    // ✅ GROUP BY DATE
    const daily = {};
    data.list.forEach(item=>{
      const date = item.dt_txt.split(" ")[0];
      if(!daily[date]) daily[date] = [];
      daily[date].push(item);
    });

    // ✅ GENERATE NEXT 7 DAYS
    const next7Days = [];
    for(let i=0;i<7;i++){
      const d = new Date();
      d.setDate(d.getDate() + i);
      next7Days.push(d.toISOString().split("T")[0]);
    }

    let labels = [];
    let temps = [];

    box.style.display = "grid";
    box.style.gridTemplateColumns = "repeat(7,1fr)";
    box.style.gap = "10px";

    next7Days.forEach((date, index) => {

      let dayData = daily[date];

      // 🔥 FIX: IF NO DATA (LIKE SUNDAY)
      if(!dayData){

        // fallback → previous day
        const prevDate = next7Days[index - 1];
        dayData = daily[prevDate];

        // if still missing → use any last available
        if(!dayData){
          const allDates = Object.keys(daily);
          dayData = daily[allDates[allDates.length - 1]];
        }
      }

      const dayName = new Date(date)
        .toLocaleDateString("en-IN",{weekday:"short"});

      // ✅ AVG TEMP
      let avgTemp = 0;
      dayData.forEach(d => avgTemp += d.main.temp);
      avgTemp = (avgTemp / dayData.length).toFixed(1);

      labels.push(dayName);
      temps.push(avgTemp);

      // ✅ RAIN DETECTION
      let isRain = false;
      let maxPop = 0;

      dayData.forEach(d=>{
        const w = d.weather?.[0]?.main?.toLowerCase() || "";

        if(
          w.includes("rain") ||
          w.includes("drizzle") ||
          w.includes("thunderstorm")
        ){
          isRain = true;
        }

        if(typeof d.pop === "number" && d.pop > maxPop){
          maxPop = d.pop;
        }
      });

      // ICON
      let icon = "☀️";
      if(isRain) icon = "🌧️";
      else if(dayData[0].weather[0].main.toLowerCase().includes("cloud"))
        icon = "☁️";

      box.innerHTML += `
        <div class="weather-card">
          <h4>${dayName}</h4>
          <div style="font-size:28px">${icon}</div>
          <p>${avgTemp}°C</p>
        </div>
      `;

      // 🌧 ALERT
      if(isRain || maxPop >= 0.3){
        rainBox.innerHTML += `
          <div class="alert">
            🌧 Rain expected on <b>${dayName}</b> 
            (${Math.round(maxPop*100)}%)
          </div>
        `;
      }

    });

    // ✅ NO RAIN CASE
    if(rainBox.innerHTML === ""){
      rainBox.innerHTML = `<div class="rec">☀️ No rain expected this week</div>`;
    }
    smartIrrigation(data.list.slice(0,8), latestSensor);
    // ✅ UPDATE CHART
    renderWeatherChart(labels, temps);

  }catch(err){
    console.log("Weather Error:", err);
  }
}


function renderWeatherChart(labels,temps){

  const ctx = document.getElementById("weatherChart");

  if(weatherChart){
    weatherChart.destroy();
  }

  weatherChart = new Chart(ctx,{
    type:"line",
    data:{
      labels: labels,
      datasets:[
        {
          label:"Temperature Forecast",
          data: temps,
          borderColor:"orange",
          tension:0.4,
          fill:false
        }
      ]
    },
    options:{
      responsive:true,
      scales:{
        y:{
          beginAtZero:false
        }
      }
    }
  });
}
// ---------------- CHART ----------------
function initChart(){
  const ctx = document.getElementById("chart");

  chart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:[],
      datasets:[
        {label:"Temperature",data:[]},
        {label:"Soil Moisture",data:[]}
      ]
    }
  });
}
function smartIrrigation(weatherData, sensorData){

  const box = document.getElementById("irrigationBox");
  box.innerHTML = "";

  if(!weatherData || !sensorData) return;

  // 🌧 Check rain
  const rain = weatherData.some(d => {
    const w = d.weather?.[0]?.main?.toLowerCase() || "";
    return w.includes("rain") || w.includes("drizzle");
  });

  // 📊 Sensor values
  const soil = sensorData.soilMoisture;
  const temp = sensorData.temperature;

  // 🧠 DECISION LOGIC
  if(rain){
    box.innerHTML = `
      <div class="rec">⛔ Rain expected → Skip irrigation</div>
    `;
    return;
  }

  if(soil < 30){
    box.innerHTML = `
      <div class="rec">💧 Soil very dry → Irrigate immediately</div>
    `;
  }
  else if(soil >= 30 && soil <= 60){
    box.innerHTML = `
      <div class="rec">⚖ Moderate soil → Light irrigation</div>
    `;
  }
  else{
    box.innerHTML = `
      <div class="rec">⛔ Soil wet → No irrigation needed</div>
    `;
  }

  // 🌡 Temperature override
  if(temp > 35){
    box.innerHTML += `
      <div class="rec">🔥 High temp → Increase watering frequency</div>
    `;
  }
}
function updateChart(labels,temps,soils){
  chart.data.labels = labels;
  chart.data.datasets[0].data = temps;
  chart.data.datasets[1].data = soils;
  chart.update();
}

// ---------------- NAV ----------------
function openFarm(id){
  window.location.href = "dashboard.html?userId=" + id;
}
async function createFarmer(){

  try{

    const payload = {
      userId: document.getElementById("newUserId").value.trim(),
      password: document.getElementById("newPassword").value.trim(),
      farmName: document.getElementById("farmName").value.trim(),
      location: document.getElementById("location").value.trim(),
      cropType: document.getElementById("cropType").value.trim(),
      landSize: document.getElementById("landSize").value.trim()
    };

    console.log("Sending:", payload); // 👈 DEBUG

    const res = await fetch("http://127.0.0.1:5000/api/auth/create-farmer",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    console.log("Response:", data);

    document.getElementById("createMsg").innerText =
      data.success ? "✅ Created" : "❌ Error";

    if(data.success){
      loadFarmers(); // 🔥 auto refresh
    }

  }catch(err){
    console.log("CREATE ERROR:", err);
  }
}

window.onload = () => {

  initChart();        // MUST FIRST
  loadFarmers();
  loadWeather("Delhi");
 
  setInterval(loadFarmers, 3000);
};
async function editFarmer(id){

  const res = await fetch("http://127.0.0.1:5000/api/data/all");
  const data = await res.json();

  const farmer = data.find(f => f.userId === id);

  if(!farmer) return;

  document.getElementById("editBox").style.display = "block";

  document.getElementById("editUserId").value = farmer.userId;
  document.getElementById("editFarmName").value = farmer.farmName || "";
  document.getElementById("editLocation").value = farmer.location || "";
  document.getElementById("editCropType").value = farmer.cropType || "";
  document.getElementById("editLandSize").value = farmer.landSize || "";
}
async function updateFarmer(){

  const id = document.getElementById("editUserId").value;

  const payload = {
    farmName: document.getElementById("editFarmName").value,
    location: document.getElementById("editLocation").value,
    cropType: document.getElementById("editCropType").value,
    landSize: document.getElementById("editLandSize").value
  };

  const res = await fetch(`http://127.0.0.1:5000/api/auth/update-farmer/${id}`,{
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  document.getElementById("editMsg").innerText =
    data.success ? "✅ Updated" : "❌ Failed";

  if(data.success){
    loadFarmers();
    closeEdit();
  }
}

async function deleteFarmer(id){
  if(!confirm("Delete this farmer?")) return;

  await fetch(`http://127.0.0.1:5000/api/auth/delete-farmer/${id}`,{
    method:"DELETE"
  });

  loadFarmers();
}
async function sendAlert(){

  const payload = {
    userId: document.getElementById("alertUser").value || "ALL",
    message: document.getElementById("alertMsg").value,
    type: document.getElementById("alertType").value
  };

  const res = await fetch("http://localhost:5000/api/alerts/create",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  document.getElementById("alertStatus").innerText =
    data.success ? "✅ Alert Sent" : "❌ Failed";
}