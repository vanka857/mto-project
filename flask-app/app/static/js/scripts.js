// Вспомогательные функции для управления видимостью элементов
function showLoading() {
    document.getElementById('loading').style.display = '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function is_empty(object) {
    return !object || Object.keys(object).length === 0;
}

let inventoryItems = {};
let db_connected = false;

function initializeItemState(sheetIndex, itemIndex, mtsExists, excelExists) {
    const id = `${sheetIndex}-${itemIndex}`;
    inventoryItems[id] = {
        mtsExists: mtsExists,
        excelExists: excelExists,
        writeOffChecked: false,
        putOnBalanceChecked: false,
        inStockChecked: false
    };
}

function updateItemState(id) {
    const state = inventoryItems[id];

    // Получение элементов из DOM
    const writeOffCheckbox = document.getElementById(`write-off-${id}`);
    const putOnBalanceCheckbox = document.getElementById(`put-on-balance-${id}`);

    const inStockCheckbox = document.getElementById(`in-stock-${id}`);
    const statusMtsCell = document.getElementById(`status-mts-${id}`);
    const statusExcelCell = document.getElementById(`status-excel-${id}`);

    // Обновление состояния на основе значений элементов
    state.writeOffChecked = writeOffCheckbox && writeOffCheckbox.checked;
    state.putOnBalanceChecked = putOnBalanceCheckbox && putOnBalanceCheckbox.checked;
    state.inStockChecked = inStockCheckbox && inStockCheckbox.checked;

    if (state.mtsExists) inStockCheckbox.disabled = false;

    // Обновление статусов и активности чекбоксов
    if (state.mtsExists && state.excelExists) {
        if (!state.inStockChecked) {
            statusMtsCell.textContent = 'Утеряно';
            statusMtsCell.style.color = 'red';
        } else {
            statusMtsCell.textContent = 'В наличии';
            statusMtsCell.style.color = 'grey';
        }
    } else if (!state.mtsExists && state.excelExists) {
        if (db_connected) putOnBalanceCheckbox.disabled = false;
        if (!state.putOnBalanceChecked) {
            statusExcelCell.textContent = 'Новое';
            statusExcelCell.style.color = 'green';
        } else {
            statusExcelCell.textContent = 'Будет поставлено на учет';
            statusExcelCell.style.color = 'blue';
        }

    } else if (state.mtsExists && !state.excelExists) {
        statusMtsCell.textContent = state.inStockChecked ? 'Отсутствует в ведомости' : 'Списать как утраченное';
        statusMtsCell.style.color = state.inStockChecked ? 'orange' : 'red';
        writeOffCheckbox.disabled = !state.inStockChecked;
    }
}

function addCheckboxListeners(id) {
    ['write-off', 'put-on-balance', 'in-stock'].forEach(type => {
        const checkbox = document.getElementById(`${type}-${id}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => updateItemState(id));
        }
    });
}

// Функции для работы с файлами и загрузки данных
async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
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

function resetPage() {
    inventoryItems = {};
    db_connected = false;
    document.getElementById('output').innerHTML = '';
    document.getElementById('file-name').textContent = '';
    document.querySelectorAll('.action-button').forEach(button => button.disabled = true);
    hideLoading();
}

// Функции для обновления UI элементов
function updateTable(data) {
    const container = document.getElementById('output');
    container.innerHTML = '';
    data.inventories.forEach((sheet, sheet_index) => {
        createSheet(sheet, sheet_index, container);
    })

    data.inventories.forEach((sheet, sheet_index) => {
        sheet.items.forEach((item, index) => {
            const id = `${sheet_index}-${index}`;
            addCheckboxListeners(id);
            updateItemState(id);
        });
    })
}

function createSheet(sheet, sheet_index, container) {
    const section = document.createElement('div');
    section.className = 'inventory-section';
    
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = `Инвентаризационная ведомость №${sheet.number} от ${sheet.date}`;
    details.appendChild(summary);
    
    const table = createTable(sheet, sheet_index);

    const inventoryTableContainer = document.createElement('div');
    inventoryTableContainer.className = 'inventory-table-container';
    inventoryTableContainer.appendChild(table);
    details.appendChild(inventoryTableContainer);
    section.appendChild(details);
    container.appendChild(section);
}

function createTable(sheet, sheet_index) {
    const table = document.createElement('table');
    table.className = 'inventory-table';
    table.innerHTML = `<thead><tr><th>Номер в ведомости</th><th>Инвентарный номер</th><th>Наименование</th><th>Единица измерения</th><th>Количество</th><th>Стоимость</th></tr></thead>`;
    
    const tbody = document.createElement('tbody');
    
    sheet.items.forEach((item, index) => {
        createRow(tbody, item, sheet_index, index);
    });
    
    table.appendChild(tbody);
    return table;
}

function createRow(tbody, item, sheet_index, index) {
    const excelRow = item.excel_data ? createDataRow(item.excel_data, 'excel-row', `excel-${sheet_index}-${index}`, sheet_index, index) : null;
    const mtsRow = item.mts_data ? createDataRow(item.mts_data, 'mts-row', `mts-${sheet_index}-${index}`, sheet_index, index) : null;

    // Инициализация состояния
    initializeItemState(sheet_index, index, mtsRow !== null, excelRow !== null);

    if (excelRow) tbody.appendChild(excelRow);
    if (mtsRow) tbody.appendChild(mtsRow);
    return tbody;
}

function createDataRow(data, className, id, sheet_index, index) {
    if (is_empty(data)) return null;
    const row = document.createElement('tr');
    row.id = id;
    row.className = className;

    id1 = `${sheet_index}-${index}`;

    row.innerHTML = `
        <td>${data.num_in_inventory || ''}</td>
        <td>${data.inventory_number || ''}</td>
        <td>${data.item_name || ''}</td>
        <td>${data.unit_of_measure || ''}</td>
        <td>${data.volume || ''}</td>
        <td>${data.price || ''}</td>
    `;

    const checkboxCell = document.createElement('td');
    const statusCell = document.createElement('td');

    if (className === 'mts-row') {
        const inStockCheckbox = createCheckbox(`in-stock-${id1}`, 'Есть в наличие');
        checkboxCell.appendChild(inStockCheckbox);

        const writeOffCheckbox = createCheckbox(`write-off-${id1}`, 'Списать');
        checkboxCell.appendChild(writeOffCheckbox);

        statusCell.id = `status-mts-${id1}`;
    }
    if (className === 'excel-row') {
        const putOnBalanceCheckbox = createCheckbox(`put-on-balance-${id1}`, 'Поставить на учет');
        checkboxCell.appendChild(putOnBalanceCheckbox);

        statusCell.id = `status-excel-${id1}`;
    }
    row.appendChild(statusCell);
    row.appendChild(checkboxCell);

    return row;
}

function createCheckbox(id, label) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.disabled = true;  // Изначально отключен, активируется в соответствии с логикой состояния

    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;

    const checkboxCell = document.createElement('div');
    checkboxCell.appendChild(checkbox);
    checkboxCell.appendChild(labelElement);

    return checkboxCell;
}

function readFile() {
    showLoading();
    fetch('/read').then(response => response.json()).then(data => {
        updateTable(data);
        document.getElementById('fetch-from-db-button').disabled = false;
        hideLoading();
    }).catch(error => {
        hideLoading();
        console.error('Error fetching inventory data:', error);
    });
}

function editRowById(rowId, newData) {
    const row = document.getElementById(rowId);
    if (row) {
        Object.entries(newData).forEach(([key, value], index) => {
            if (row.cells[index]) row.cells[index].textContent = value || row.cells[index].textContent;
        });
    } else {
        console.error('No row found with ID:', rowId);
    }
}

function fetchFromDB() {
    fetch('/fetch-from-db')
    .then(response => response.json())
    .then(data => {
        db_connected = true;
        updateTable(data);
        document.getElementById('send-updates-button').disabled = false;
    })
    .catch(error => console.error('Error:', error));
}
    
function parseId(id) {
    const parts = id.split('-');
    const sheetIndex = parseInt(parts[0], 10); // Преобразуем в число, если это необходимо
    const itemIndex = parseInt(parts[1], 10); // Преобразуем в число, если это необходимо

    return { sheetIndex, itemIndex };
}

// Функция для сбора и отправки изменений на сервер
function sendUpdates() {
    let updates = [];

    for (let id in inventoryItems) {
        const state = inventoryItems[id];
        if (state.writeOffChecked || state.putOnBalanceChecked) {
            const { sheetIndex, itemIndex } = parseId(id);
            updates.push({
                sheetIndex: sheetIndex,
                itemIndex: itemIndex,
                writeOff: state.writeOffChecked,
                putOnBalance: state.putOnBalanceChecked,
            });
        }
    }

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
    fetch('/update-inventory', {
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
