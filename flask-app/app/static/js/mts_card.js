// здесь лежат функции, генерирующий контент, связанный
// с карточкой mts: для модального окна или для отдельной страницы

function openCardModal(item_data, id, on_save_callback) {
    const container =  `
        <div class="container">
            <div id="card-header">
                <span id="inv-number"></span>
                <span id="name"></span>
            </div>
            <table id="card-table">
                <thead>
                <tr>
                    <th class="excel-cell">Данные из excel</th>
                    <th class="error-cell"></th>
                    <th class="mts-cell">Данные из базы</th>
                </tr>
                </thead>
                <tbody id="card-table-body">
                </tbody>
            </table>
        </div>`;

    setModalContent(container);

    table = document.getElementById('card-table');
    switch (item_data.getDataState()){
        case 'mts-only':
            table.classList.add('hide1-2');
            break;
        case 'excel-only':
            table.classList.add('hide2-3');
            break;
    }

    table_body = document.getElementById('card-table-body');

    item_data.visible_keys.forEach(key_id => {
        table_body.appendChild(getCardRow(key_id, item_data.keys_dict[key_id], item_data));
    });

    addButtonListeners();

    // table_body.innerHTML += item_data;
    // adding data
    // call on_save_callback

    showModal();
}

function getCardRow(key_id, key_name, item_data) {
    const [excelValue, mtsValue, enriched_value] = item_data.getSourceDataValue(key_id);

    const innerHTML = `
        <tr>
            <td class="data-cell excel-cell">
                <span class="data-label">${key_name}</span>
                <button class="edit-btn" data-id="${key_id}-1">Изменить</button>
                <div class="data-display" id="data-${key_id}-1" contentEditable="false">${excelValue}</div>
            </td>
            <td class="error-cell" id="error-${key_id}"></td>
            <td class="data-cell mts-cell">
                <span class="data-label">${key_name}</span>
                <button class="edit-btn" data-id="${key_id}-2">Изменить</button>
                <div class="data-display" id="data-${key_id}-2" contentEditable="false">${mtsValue}</div>
            </td>
        </tr>`;

    const row = document.createElement('tr');
    row.innerHTML = innerHTML;
      
    return row;
}

function addButtonListeners() {
    const editButtons = document.querySelectorAll('.edit-btn');
      
    editButtons.forEach(button => {
        button.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const displayDiv = document.getElementById('data-' + id);
        // const errorCell = document.getElementById('error-' + id);
    
        if (displayDiv.contentEditable === 'false') {
            this.textContent = 'Сохранить';
            this.classList.add('edit-btn-active');

            displayDiv.classList.add('data-display-editable');
            displayDiv.contentEditable = 'true';
            // errorCell.textContent = ''; // Очистка сообщения об ошибке при редактировании
        } else {
            const newValue = displayDiv.textContent;
            if (false && newValue.trim() === '') {
            errorCell.textContent = 'Значение не может быть пустым';
            } else {
                this.textContent = 'Изменить';
                this.classList.remove('edit-btn-active');

                displayDiv.classList.remove('data-display-editable');
                displayDiv.contentEditable = 'false';
                // save changes
                // errorCell.textContent = ''; // Очистка сообщения об ошибке при успешном сохранении
            }
        }
        });
    });
}
