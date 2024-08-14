let db_connected = false;
let data_tables = [];

// Вспомогательные функции для управления видимостью элементов
function showLoading() {
    document.getElementById('loading').style.display = '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Функции для работы с файлами и загрузки данных
async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/fetch/upload', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        document.getElementById('file-name').textContent = `Uploaded: ${data.filename}`;
        document.getElementById('read-file-button').disabled = false;
    } catch (error) {
        console.error('Error:', error);
    }
}

function readFile() {
    showLoading();
    fetch('/fetch/read').then(response => response.json()).then(data => {
        updateDataPage(data);
        document.getElementById('fetch-from-db-button').disabled = false;
        hideLoading();
    }).catch(error => {
        hideLoading();
        console.error('Error fetching inventory data:', error);
    });
}

function resetPage() {
    db_connected = false;
    document.getElementById('output').innerHTML = '';
    document.getElementById('file-name').textContent = '';
    document.querySelectorAll('.action-button').forEach(button => button.disabled = true);
    hideLoading();
}

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

// Функции для обновления UI элементов
function updateDataPage(data) {
    data_tables = [];

    const container = document.getElementById('output');
    container.innerHTML = '';
    data.inventories.forEach((sheet_data, sheet_index) => {
        createSheet(sheet_data, sheet_index, container);
    })
}
