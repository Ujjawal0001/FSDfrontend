// Simulated live data
setInterval(() => {
  const temp = (20 + Math.random()*10).toFixed(1);
  const hum = Math.floor(40 + Math.random()*30);
  const soil = Math.floor(30 + Math.random()*40);

  if(document.getElementById("liveData")){
    document.getElementById("liveData").innerHTML = `
      <p>🌡 Temp: ${temp}°C</p>
      <p>💧 Humidity: ${hum}%</p>
      <p>🌾 Soil: ${soil}%</p>
    `;
  }

  if(document.getElementById("advice")){
    let msg = "Good condition";

    if(soil < 30) msg = "Irrigation needed";
    if(temp > 35) msg = "High temperature alert";

    document.getElementById("advice").innerHTML = `<p>${msg}</p>`;
  }

}, 3000);