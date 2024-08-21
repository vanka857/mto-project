// Файл со скриптами, связанными с отображением карточки


class Card {
    /*
        Класс для отрисовки и работы карточки МТС 
        (рисуется внутри модального окна)
    */
    constructor(item_data, id) {
        this.item_data = item_data;
        this.id = id;

        this.changes = {};

        // список данных, которые будут видны в колонке данных из excel
        this.excel_visible = ['item_name', 
                              'unit_of_measure', 
                              'volume', 
                              'price'];

        // список данных, которые будут видны в колонке данных из базы (mts)
        this.mts_visible = ['item_name', 
                            'unit_of_measure', 
                            'volume', 
                            'price', 
                            'registration_date', 
                            'registration_doc_no', 
                            'write_off_date', 
                            'write_off_doc_no'];

        this.inventory_number = this.item_data.getSourceDataValueOne('inventory_number');
        this.item_name = this.item_data.getSourceDataValueOne('item_name');
    }

    // передача экземпляра модального окна в объект класса
    setModal(modal) {
        this.modal = modal;
    }

    // метод для отрисовки карточки МТС
    render() {
        const container =  `
            <div class="container">
                <div id="card-header">
                    <span id="inv-number">${this.inventory_number}</span>
                    <span id="name">${this.item_name}</span>
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

        // установка базового контейнера в модальное окно
        if (this.modal) {
            this.modal.setModalContent(container);
        }

        // добавление классов к таблице для скрытия ненужных столбцов
        // в случае, если у нас только excel или только mts данные
        const table = document.getElementById('card-table');
        switch (this.item_data.getDataState()){
            case 'mts-only':
                table.classList.add('hide1-2');
                break;
            case 'excel-only':
                table.classList.add('hide2-3');
                break;
        }

        const table_body = document.getElementById('card-table-body');

        // Структуры данных для кнопки редактирования
        const edit_button_data = {
            label: "Изменить",
            func: (button) => {
                const id = button.getAttribute('data-id');
                const displayDiv = document.getElementById('mts-data-' + id);
            
                if (displayDiv.contentEditable === 'false') {
                    button.textContent = 'Сохранить';
                    button.classList.add('edit-btn-active');
        
                    displayDiv.classList.add('data-display-editable');
                    displayDiv.contentEditable = 'true';
                } else {
                    button.textContent = 'Изменить';
                    button.classList.remove('edit-btn-active');
    
                    displayDiv.classList.remove('data-display-editable');
                    displayDiv.contentEditable = 'false';
    
                    this.addChanges(id);
                    this.updateDiscrepancy(id);
                }
            }
        }

        // Добавление строк с таблицу
        this.item_data.visible_keys.forEach(key_id => {
            let row;
            if (this.mts_visible.includes(key_id)) {
                // Создание строки с кнопкой редактирования
                row = this.getCardRow(key_id, this.item_data.keys_dict[key_id], edit_button_data);
            }
            else {
                // Создание строки без кнопок
                row = this.getCardRow(key_id, this.item_data.keys_dict[key_id]);    
            }
            table_body.appendChild(row);    
             
            // Обработка проблемы со вставкой html-кода в contentEditable div
            var contentEditableNodes = document.querySelectorAll('.data-display');
            [].forEach.call(contentEditableNodes, function(div) {
                div.addEventListener("input", 
                    function() {
                        const textContent = this.textContent;
                        this.textContent = textContent
                    }, 
                    false);
            });
            
            // обновления столбца с расхождениями 
            // для отображения расхождений, если они есть сразу
            this.updateDiscrepancy(key_id);
        });

        // показ модального окна с контентом, если оно задано
        if (this.modal) {
            this.modal.showModal();
        }
    }

    // меод, который готовит строку в таблице на карточке Card
    getCardRow(key_id, key_name, button_data) {
        const [excel_value, mts_value, enriched_value] = this.item_data.getSourceDataValue(key_id);
    
        // Создание основного элемента строки
        const row = document.createElement('tr');
    
        // Создание ячейки для данных Excel
        const excelCell = document.createElement('td');
        excelCell.className = 'data-cell excel-cell';
        row.appendChild(excelCell);
    
        if (this.excel_visible.includes(key_id)) {
            // Название данных
            const excelLabel = document.createElement('span');
            excelLabel.className = 'data-label';
            excelLabel.textContent = key_name;
            excelCell.appendChild(excelLabel);
        
            // Отображение данных Excel
            const excelData = document.createElement('div');
            excelData.className = 'data-display';
            excelData.id = `excel-data-${key_id}`;
            excelData.contentEditable = 'false';
            excelData.textContent = excel_value || '';
            excelCell.appendChild(excelData);
        }
        
        // Создание ячейки для ошибок
        const errorCell = document.createElement('td');
        errorCell.className = 'error-cell';
        errorCell.id = `error-${key_id}`;
        row.appendChild(errorCell);

        // Создание ячейки для данных MTS
        const mtsCell = document.createElement('td');
        mtsCell.className = 'data-cell mts-cell';
        row.appendChild(mtsCell);

        // Определяем выводимое значение в ячейке MTS. 
        // Если есть mts_value, то выводим его, 
        // иначе выводим enriched_value, если оно есть
        let value;
        if (mts_value) value = mts_value;
        else if (enriched_value) value = enriched_value;
        else value = '';

        //Наполняем ячейку MTS в двух случаях: если ключ включен в mts_visible, 
        // либо если фактически есть расширенные (enriched) данные по этому ключу
        if (this.mts_visible.includes(key_id) || enriched_value) {
            // Название данных MTS
            const mtsLabel = document.createElement('span');
            mtsLabel.className = 'data-label';
            mtsLabel.textContent = key_name;
            mtsCell.appendChild(mtsLabel);
        
            // Статус данных MTS
            const mtsStatusLabel = document.createElement('span');
            mtsStatusLabel.className = 'data-status-label data-status-label-hide';
            mtsStatusLabel.id = `data-status-label-${key_id}`;
            mtsCell.appendChild(mtsStatusLabel);
        
            // Кнопка
            if (button_data) {
                const button = document.createElement('button');
                button.className = 'edit-btn';
                button.dataset.id = key_id;
                button.addEventListener('click', () => button_data.func(button));
                button.textContent = button_data.label;
                mtsCell.appendChild(button);
            }
        
            // Отображение данных MTS
            const mtsData = document.createElement('div');
            mtsData.className = 'data-display';
            mtsData.id = `mts-data-${key_id}`;
            mtsData.contentEditable = 'false';
            mtsData.textContent = value;
            mtsCell.appendChild(mtsData);
        }
    
        return row;
    }

    // Метод для обновления столбца с расхождениями в данных
    updateDiscrepancy(key_id) {
        const mts_elem = document.getElementById('mts-data-' + key_id);
        const mts_value = mts_elem ? mts_elem.textContent : null;
        const excel_elem = document.getElementById('excel-data-' + key_id);
        const excel_value = excel_elem ? excel_elem.textContent : null;

        const errorCell = document.getElementById('error-' + key_id);
        
        if (mts_value && excel_value && mts_value !== excel_value) {
            errorCell.textContent = '⚠';
        }
        else {
            errorCell.textContent = '';
        }
    }

    // Добавление нового значения в словарь обновлений. 
    // key-id — это столбца с данными
    addChanges(key_id) {
        this.changes[key_id] = document.getElementById('mts-data-' + key_id).textContent;
        const data_status_label = document.getElementById('data-status-label-' + key_id);
        data_status_label.textContent = 'Изменено';
    }

    getChanges() {
        return this.changes;
    }
}
