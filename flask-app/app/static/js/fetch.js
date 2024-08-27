// Файл со скриптами для страницы внесения данных (fetch)

// Храним статус наличия активного подключения к 
let db_connected = false;

// Храним выводимые на странице таблицы
let data_tables = [];

// При загрузке страницы добавлеям обработчики для кнопок
document.addEventListener('DOMContentLoaded', function() {
    resetPage();

    var form = document.getElementById('upload-form');
    var fileInput = form.querySelector('input[type="file"]');
    var submitButton = form.querySelector('button[type="submit"]');

    // Обработчик события изменения значения поля выбора файла
    fileInput.addEventListener('change', function() {
        // Проверка, выбран ли файл
        resetPage();
        submitButton.disabled = !this.files.length;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the default form submission
        const file = fileInput.files[0];
        uploadFile(file);
    });   

    document.getElementById('read-file-button').addEventListener('click', function() {readFile();});
    document.getElementById('fetch-from-db-button').addEventListener('click', function() {fetchFromDB();});
    document.getElementById('send-updates-button').addEventListener('click', function() {sendUpdates();});

});

// Вспомогательные функции для управления видимостью лоадера
function showLoading() {
    document.getElementById('loading').style.display = '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Функция для работы с файлами и загрузки данных
async function uploadFile(file) {
    // получение файла из инпута
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
    data_tables = [];
    document.getElementById('output').innerHTML = '';
    document.querySelectorAll('.action-button').forEach(button => {
        button.disabled = true;
    });
    hideLoading();
}

// функция создания секции с таблицей
function createSheet(sheet_data, sheet_index, container) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.className = 'inventory-summary';

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
        alert('Нет изменений для отправки!');
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
