
// Variáveis globais para guardar os valores

let preco_gsl = 6.28;
let preco_etnl = 4.17;
const autonomia_etnl = 8;
const autonomia_gsl = 13;
let distanciaKm = 0;
let duracaoH = 0;
let duracaoMin = 0;

// Inicializa o mapa
const map = L.map('map').setView([-14.235, -51.9253], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let rotaLayer = null;

// Função para geocodificar pelo nome (usando Nominatim)
async function geocodificar(endereco) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } else {
    alert(`Endereço não encontrado: ${endereco}`);
    return null;
  }
}

// Função para buscar rota OSRM
async function buscarRota(origem, destino) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origem[1]},${origem[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('Rota não encontrada');
      return null;
    }

    const rota = data.routes[0];

    // Valores
    const distanciaKm = rota.distance / 1000;
    const duracaoH = rota.duration / 3600;
    const duracaoMin = rota.duration / 60;

    // Desenha rota no mapa
    if (rotaLayer) map.removeLayer(rotaLayer);
    rotaLayer = L.geoJSON(rota.geometry, { color: 'blue', weight: 5 }).addTo(map);
    map.fitBounds(rotaLayer.getBounds());

    // Dispara evento customizado com os valores
    const evento = new CustomEvent('rotaCalculada', { detail: { distanciaKm, duracaoH, duracaoMin } });
    document.dispatchEvent(evento);

    return { distanciaKm, duracaoH, duracaoMin, rota };

  } catch (error) {
    console.error('Erro ao buscar rota:', error);
    return null;
  }
}

// Evento do botão
document.getElementById('btnRota').addEventListener('click', async () => {
  const origemNome = document.getElementById('origem').value;
  const destinoNome = document.getElementById('destino').value;

  if (!origemNome || !destinoNome) {
    alert('Digite origem e destino.');
    return;
  }

  const origemCoord = await geocodificar(origemNome);
  const destinoCoord = await geocodificar(destinoNome);

  if (origemCoord && destinoCoord) {
    // Limpa marcadores antigos
    map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });

    // Adiciona marcadores
    L.marker(origemCoord).addTo(map).bindPopup(origemNome).openPopup();
    L.marker(destinoCoord).addTo(map).bindPopup(destinoNome).openPopup();

    // Busca a rota
    await buscarRota(origemCoord, destinoCoord);
  }
});



// Listener para receber os valores da rota
document.addEventListener('rotaCalculada', (e) => {
  distanciaKm = e.detail.distanciaKm;
  duracaoH = e.detail.duracaoH;
  duracaoMin = e.detail.duracaoMin;

  atualizarPainel();
 arrumarMinutos();

});

// Função para calcular velocidade média e gastos
function calcular() {
  
  horas = Math.floor(duracaoH);
  minutos = (duracaoH % 1) * 60; 

  const vlc_media = (distanciaKm / duracaoH).toFixed(0);
  const gasto_gsl = ((distanciaKm / autonomia_gsl) * preco_gsl).toFixed(2);
  const gasto_etnl = ((distanciaKm / autonomia_etnl) * preco_etnl).toFixed(2);


  return { vlc_media, gasto_gsl, gasto_etnl,minutos,horas};
}

function arrumarMinutos(){
    if (minutos < 10) {
    minutos = '0' + minutos.toFixed(0);
  } else { if (minutos >= 10) {
    minutos = minutos.toFixed(0);
  } 
   
  }
    return minutos;
}  




// Função para atualizar os spans da info-box
function atualizarPainel() {
  const calculos = calcular();

  document.getElementById("distancia").innerText = distanciaKm.toFixed(2);


if (minutos < 60 && horas < 1) {
 document.getElementById("duracao").innerText = horas + ':0' + calculos.minutos.toFixed(0) + " minutos";
  } else { 
 document.getElementById("duracao").innerText = horas + `:` + calculos.minutos.toFixed(0) + " horas";
}

  document.getElementById("velocidade").innerText = calculos.vlc_media;
  document.getElementById("gasto_gsl").innerText = calculos.gasto_gsl;
  document.getElementById("gasto_etnl").innerText = calculos.gasto_etnl;
  document.getElementById("preco_gsl").innerText = calculos.preco_gsl.toFixed(2);
  document.getElementById("preco_etnl").innerText = calculos.preco_etnl.toFixed(2);


}


//git add .
//git commit -m "mensagem explicando o que mudou"
//git push
