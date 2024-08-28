// Файл со скриптами, связанными с отображением карточки

class EditForm {
    /*
        Класс для форм редактирования помещения и ответственного
    */
    constructor(mts_id, form_elem, on_save_callback) {
        this.form_elem = form_elem
        this.form_elem.mts_id.value = mts_id;
        this.on_save_callback = on_save_callback
        
        this.form_container = this.form_elem.querySelector('.edit-form-container');
        this.form_container.hidden = true;

        this.button = this.form_elem.querySelector('input.edit-form-submit-button');
        
        if (this.button) {
            this.default_text_content = this.button.value;
            this.button.disabled = true;            
            this.editing = false;
            this.button.addEventListener('click', (event) => {
                event.preventDefault(); // Предотвращаем стандартное поведение формы

                if (this.editing) {
                    this.save();
                    this.button.value = this.default_text_content;
                    this.button.classList.remove('edit-btn-active');
                    this.form_container.hidden = true;
                } else {
                    this.button.value = 'Сохранить';
                    this.button.classList.add('edit-btn-active');
                    this.form_container.hidden = false;
                }
                
                this.editing = !this.editing;
            });   
        }
    }

    enable() {
        if (this.button) {
            this.button.disabled = false;
        }
    }

    disable() {
        if (this.button) {
            this.button.disabled = true;
        }
    }

    save() {
        const formData = new FormData(this.form_elem);
        
        // Запрос на сервер для поиска
        fetch('/get-modal-content', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.on_save_callback(this, formData, data.date_time);
                this.form_elem.reset();
            } else if (!data.nothing_to_change){
                alert(data.message);
            }
        })
        .catch(error => {
            alert(error.message);
        });        
    }
}


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
                            'category_name',
                            'registration_date', 
                            'registration_doc_no', 
                            'responsible_surname', 
                            'latest_appointment_date_time',
                            'room_name',
                            'latest_movement_date_time'];

        this.inventory_number = this.item_data.getSourceDataValueOne('inventory_number');
        this.item_name = this.item_data.getSourceDataValueOne('item_name');
    }

    // передача экземпляра модального окна в объект класса
    setModal(modal) {
        this.modal = modal;
    }

    showImage(filename) {
        if (!filename) {
            filename = this.item_data.getSourceDataValueOne('image_filename')
        }
        if (filename) {
            const imgElement = document.getElementById('mts-image');
            imgElement.src = `/images/${filename}`;
            imgElement.style.display = 'block'; // Показываем изображение
        } 
    }

    // метод для отрисовки карточки МТС
    render() {

        // Запрос шаблона базового контейнера с сервера
        fetch('/get-modal-content')
        .then(response => response.text())
        .then(html => {
            if (this.modal) {
                // Установка шаблона карточки в модальное окно
                this.modal.setModalContent(html);
                document.querySelector('#card-header #inv-number').textContent = this.inventory_number;
                document.querySelector('#card-header #name').textContent = this.item_name;

                const state = this.item_data.getDataState();
                const mts_id = this.item_data.getSourceDataValueOne('id');

                // Создание и настройка форм редактирования помещения и ответственного
                const on_save_room_callback = (edit_form, form_data, date_time) => {
                    this.item_data.changeData('room_name', form_data.get('new_room'));
                    this.item_data.changeData('latest_movement_date_time', date_time);
                    // TODO optimistic update room name
                };
                this.room_edit_form = new EditForm(mts_id, document.getElementById('room-edit-form'), on_save_room_callback);
                
                const on_save_owner_callback = (edit_form, form_data, date_time) => {
                    this.item_data.changeData('responsible_surname', form_data.get('new_owner'));
                    this.item_data.changeData('latest_appointment_date_time', date_time);
                    // TODO optimistic update owner name
                };
                this.owner_edit_form = new EditForm(mts_id, document.getElementById('owner-edit-form'), on_save_owner_callback);

                if (state == 'mts-only' || state == 'both-data') {
                    this.room_edit_form.enable();
                    this.owner_edit_form.enable();
                }

                // Создание блока для отрисовки и редактирования картинок
                if (mts_id) {
                        this.addImageBlock(mts_id);
                }
                
                // добавление классов к таблице для скрытия ненужных столбцов
                // в случае, если у нас только excel или только mts данные
                const table = document.getElementById('card-table');
                switch (state){
                    case 'mts-only':
                        table.classList.add('hide1-2');
                        break;
                    case 'excel-only':
                        table.classList.add('hide2-3');
                        break;
                }

                // Добавление данных и кнопок в таблицу
                const table_body = document.getElementById('card-table-body');
                this.addRows(table_body);

                // Отображение изображения
                this.showImage();

                // показ модального окна с контентом, если оно задано
                if (this.modal) {
                    this.modal.showModal();
                }
            }
        })
        .catch(error => console.error('Error loading the modal content:', error));
    }

    // Метод добавления блока с изображениями
    addImageBlock(mts_id) {
        const form = document.getElementById('card-upload-form')
        form.style.display = 'flex';

        var fileInput = form.querySelector('input[type="file"]');
        var submitButton = form.querySelector('button[type="submit"]');

        // Обработчик события изменения значения поля выбора файла
        fileInput.addEventListener('change', function() {
            // Проверка, выбран ли файл
            submitButton.disabled = !this.files.length;
        });

        // Добавление обработчиков для кнопок
        // Handle form submission to upload image
        form.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent the default form submission

            const formData = new FormData();
            const file = fileInput.files[0];

            if (file) {
                formData.append('file', file);

                fetch(`/upload/${mts_id}`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Картинка успешно загружена!');
                        this.showImage(data.filename);
                    } else {
                        alert('Ошибка при загрузке картинки');
                    }
                })
                .catch(error => {
                    console.error('Error uploading image:', error);
                });
            } else {
                alert('Сначала выберите файл');
            }
        });
    }

    // Метод для добавление строк с данными и кнопками в таблицу
    addRows(table_body) {
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
    
                    this.addSimpleChanges(id);
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

        // Наполняем ячейку MTS в двух случаях: если ключ включен в mts_visible, 
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

                button.disabled = true;

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
    addSimpleChanges(key_id) {
        this.changes[key_id] = document.getElementById('mts-data-' + key_id).textContent;
        const data_status_label = document.getElementById('data-status-label-' + key_id);
        data_status_label.textContent = 'Изменено';
    }

    getChanges() {
        return this.changes;
    }
}
