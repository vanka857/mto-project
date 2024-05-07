function showLoading() {
    document.getElementById('loading').style.display = '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function uploadFile() {
    var fileInput = document.getElementById('file-input');
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('file-name').textContent = 'Uploaded: ' + data.filename;
        document.getElementById('read-file-button').disabled = false;
    })
    .catch(error => console.error('Error:', error));
}

function resetPage() {
    // Очистка вывода и имени файла
    document.getElementById('output').innerHTML = '';
    document.getElementById('file-name').textContent = '';

    // Деактивация кнопок
    document.getElementById('read-file-button').disabled = true;
    document.getElementById('fetch-from-db-button').disabled = true;

    hideLoading();
}

function updateTable(data) {
    const container = document.getElementById('output');
    container.innerHTML = '';

    data.inventories.forEach((sheet, sheet_index) => {
        const section = document.createElement('div');
        section.className = 'inventory-section';
    
        // Создаем <details> и <summary>
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = `Инвентаризационная ведомость №${sheet.number} от ${sheet.date}`;
        details.appendChild(summary);
    
        // Создаем таблицу
        const table = document.createElement('table');
        table.classList.add('inventory-table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Номер в ведомости</th>
                    <th>Инвентарный номер</th>
                    <th>Наименование</th>
                    <th>Единица измерения</th>
                    <th>Количество</th>
                    <th>Стоимость</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
    
        sheet.items.forEach((item, index) => {
            const excelRow = createRow(item.excel_data, 'excel-row', `excel-${sheet_index}-${index}`);
            const mtsRow = createRow(item.mts_data, 'mts-row', `mts-${sheet_index}-${index}`);
            
            if (!excelRow && !mtsRow) return null;

            // // Добавляем кнопки в зависимости от класса
            // if (excelRow && !mtsRow) {
            //     excelRow.innerHTML += `<td><button class="button-action-item put-on-balance" disabled onclick="putOnBalance('${sheet_index}', '${index}')">Поставить на учет</button></td>`;
            // } else if (!excelRow && mtsRow) {
            //     mtsRow.innerHTML += `<td><button class="button-action-item write-off" disabled onclick="writeOff('${sheet_index}', '${index}')">Списать</button></td>`;
            // } else if (excelRow && mtsRow){
            //     excelRow.innerHTML += `<td></td>`;
            //     mtsRow.innerHTML += `<td></td>`;
            // }                           
            
            if (excelRow) tbody.appendChild(excelRow);
            if (mtsRow) tbody.appendChild(mtsRow);
        });
    
        details.appendChild(table);
        section.appendChild(details);
        container.appendChild(section);
    });
}


function readFile() {
    showLoading(); // Показать анимацию загрузки

    fetch('/read')
    .then(response => response.json())
    .then(data => {
        updateTable(data);
        document.getElementById('fetch-from-db-button').disabled = false;
        hideLoading(); // Скрыть анимацию загрузки
    })
    .catch(error => {
        hideLoading(); // Скрыть анимацию загрузки
        console.error('Error fetching inventory data:', error)
    });
}

function is_empty(object) {
    return !object || Object.keys(object).length === 0
}

function enableButtonsByСssSelector(selector) {
    const buttons = document.querySelectorAll(selector);
    for (let button of buttons) {
        button.disabled = false; // Активировать кнопку
    }
}

// function createRow(data, className, id) {
//     if (is_empty(data)) return null;
//     const row = document.createElement('tr');
//     row.id = id;  // Уникальный идентификатор для каждой строки
//     row.className = className;
//     row.innerHTML = `
//         <td>${data.num_in_inventory || ''}</td>
//         <td>${data.inventory_number || ''}</td>
//         <td>${data.item_name || ''}</td>
//         <td>${data.unit_of_measure || ''}</td>
//         <td>${data.volume || ''}</td>
//         <td>${data.price || ''}</td>
//     `;

//     return row;
// }

function createRow(data, className, id) {
    if (is_empty(data)) return null;
    const row = document.createElement('tr');
    row.id = id; // Установка уникального ID для строки
    row.className = className;
    row.innerHTML = `
        <td>${data.num_in_inventory || ''}</td>
        <td>${data.inventory_number || ''}</td>
        <td>${data.item_name || ''}</td>
        <td>${data.unit_of_measure || ''}</td>
        <td>${data.volume || ''}</td>
        <td>${data.price || ''}</td>
    `;

    const actionCell = document.createElement('td');
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${id}`; // Уникальный ID для чекбокса
    checkbox.disabled = true; // Неактивный по умолчанию

    let label = document.createElement('label');
    label.htmlFor = checkbox.id;

    if (className === 'excel-row') {
        checkbox.className = 'put-on-balance';
        label.textContent = " Поставить на учет";
    } else if (className === 'mts-row') {
        checkbox.className = 'write-off';
        label.textContent = " Списать";
    }

    actionCell.appendChild(checkbox);
    actionCell.appendChild(label); // Добавление подписи рядом с чекбоксом
    row.appendChild(actionCell);

    return row;
}

function editRowById(rowId, newData) {
    const row = document.getElementById(rowId);
    if (row) {
        // Предполагаем, что структура строки соответствует следующему порядку столбцов:
        // Номер в ведомости, Инвентарный номер, Наименование, Единица измерения, Количество, Стоимость
        // Обновляем содержимое ячеек
        row.cells[0].textContent = newData.num_in_inventory || row.cells[0].textContent;
        row.cells[1].textContent = newData.inventory_number || row.cells[1].textContent;
        row.cells[2].textContent = newData.item_name || row.cells[2].textContent;
        row.cells[3].textContent = newData.unit_of_measure || row.cells[3].textContent;
        row.cells[4].textContent = newData.volume || row.cells[4].textContent;
        row.cells[5].textContent = newData.price || row.cells[5].textContent;
    } else {
        console.error('No row found with ID:', rowId);
    }
}

function fetchFromDB() {
    fetch('/fetch-from-db')
    .then(response => response.json())
    .then(data => {
        updateTable(data);
        enableButtonsByСssSelector('.put-on-balance');
        enableButtonsByСssSelector('.write-off');
    })
    .catch(error => console.error('Error:', error));
}

function putOnBalance(sheet_id, id) {
    console.log('Putting item on balance:', sheet_id, id);
    // Здесь код для вызова API поставить на учет
}

function writeOff(sheet_id, id) {
    console.log('Writing off item:', sheet_id, id);
    // Здесь код для вызова API списать объект
}
