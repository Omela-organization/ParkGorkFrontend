const map = new mapgl.Map('map_container', {
  key: '416e414a-a95c-4ea3-b852-3df70d1ccb69',
  center: [37.60141, 55.72844],
  zoom: 17,
  lang: 'ru'});

let marker = null; 
function addMarker(coordinates) { 
  if (marker) { marker.destroy(); } // Добавляем новый маркер 
  marker = new mapgl.Marker(map, { 
    coordinates: coordinates, }); // Центрируем карту на новых координатах 
    map.setCenter(coordinates);
  }

async function fetchData() { 
  try { 
    const response = await fetch("reports.json"); 
    const data = await response.json();
    
    const tableBody = document.getElementById('table_body'); 
    tableBody.innerHTML = ''; // Очистка таблицы перед добавлением новых данных 
    data.forEach((item) => { 
      const row = document.createElement('tr'); 
      
      row.innerHTML = ` 
        <td>${item.status}</td> 
        <td>${item.date}</td> 
        <td>${item.violationType}</td> 
        <td>${item.coordinates}</td> 
        <td><a href="${item.photo}" target="_blank">Фото</a></td> 
        <td>${item.checkStatus}</td> 
        <td><a href="#" class = "show-map" data-coords = "${item.coordinates}">Показать</a></td> `; 
        
        tableBody.appendChild(row); 
      }); 
      document.querySelectorAll('.show-map').forEach(element => { 
        element.addEventListener('click', function(event) { 
          event.preventDefault();
          const coords = this.getAttribute('data-coords').split(',').map(Number); 
          addMarker(coords); 
        });
      
      });

    } catch (error) { 
      console.error('Ошибка при загрузке данных:', error); } } // Вызов функции fetchData при загрузке страницы 
      window.onload = fetchData;