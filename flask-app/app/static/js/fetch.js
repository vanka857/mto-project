// Файл со скриптами для страницы внесения данных (fetch)

// Храним статус наличия активного подключения к 
let db_connected = false;

// Храним выводимые на странице таблицы
let data_tables = [];

// Вспомогательные функции для управления видимостью лоадера
function showLoading() {
    document.getElementById('loading').style.display = '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Функция для работы с файлами и загрузки данных
async function uploadFile() {
    // получение файла из инпута
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    // отправка файла на сервер
    try {
        const response = await fetch('/fetch/upload', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        // вывод результата отправки в интерфейсе
        document.getElementById('file-name').textContent = `Uploaded: ${data.filename}`;
        document.getElementById('read-file-button').disabled = false;
    } catch (error) {
        console.error('Error:', error);
    }
}

// функция для обработки файла на сервере и получения обработанного ответа
function readFile() {
    // показываем лоадер
    showLoading();
    // отправляем зарпос на сервер для обработки файла
    fetch('/fetch/read').then(response => response.json()).then(data => {
        updateDataPage(data);
        document.getElementById('fetch-from-db-button').disabled = false;
        hideLoading();
    }).catch(error => {
        hideLoading();
        console.error('Error fetching inventory data:', error);
    });
}

// функция сброса состояния страницы
function resetPage() {
    db_connected = false;
    document.getElementById('output').innerHTML = '';
    document.getElementById('file-name').textContent = '';
    document.querySelectorAll('.action-button').forEach(button => button.disabled = true);
    hideLoading();
}

// функция создания секции с таблицей
function createSheet(sheet_data, sheet_index, container) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    
    const details = document.createElement('details');
    const summary = document.createElement('summary');

    if (sheet_data.number) summary.textContent = `Инвентаризационная ведомость №${sheet_data.number} от ${sheet_data.date}`;
    else summary.textContent = `${sheet_data.name}`;
        
    details.appendChild(summary);
    
    const [table_html, table] = createTable(sheet_data, sheet_index, 'inventory-table', true);

    data_tables.push(table);

    const inventoryTableContainer = document.createElement('div');
    inventoryTableContainer.className = 'inventory-table-container';
    inventoryTableContainer.appendChild(table_html);
    details.appendChild(inventoryTableContainer);
    section.appendChild(details);
    container.appendChild(section);
}

// функция получения обогащенных данных (из ведомости + из базы) с сервера
function fetchFromDB() {
    fetch('/fetch/fetch-from-db')
    .then(response => response.json())
    .then(data => {
        db_connected = true;
        updateDataPage(data);
        document.getElementById('send-updates-button').disabled = false;
    })
    .catch(error => console.error('Error:', error));
}

// Функция для сбора и отправки изменений на сервер
function sendUpdates() {
    let updates = [];

    data_tables.forEach(table => {
        updates.push(...table.getUpdates());
    });

    // Проверка, есть ли что отправлять
    if (updates.length > 0) {
        submitChanges(updates);
        fetchFromDB();
    } else {
        console.log('Нет изменений для отправки');
    }
}

// Функция отправки изменений на сервер
function submitChanges(updates) {
    fetch('/fetch/update-inventory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates: updates })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Ответ сервера:', data.message);
        if (data.success) {
            alert('Изменения успешно отправлены!');
        }
    })
    .catch(error => {
        console.error('Ошибка отправки изменений:', error);
        alert('Ошибка при отправке данных на сервер. Проверьте консоль для деталей.');
    });
}

// Функции для отрисовки UI страницы
function updateDataPage(data) {
    data_tables = [];

    const container = document.getElementById('output');
    container.innerHTML = '';
    data.inventories.forEach((sheet_data, sheet_index) => {
        createSheet(sheet_data, sheet_index, container);
    })
}
