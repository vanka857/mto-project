// Файл со скриптами для создания таблиц с данными


class Checkbox {
    /*
        Класс для работы с чекбоксами на странице внесения данных
    */
    constructor(id, type, label, row) {
        this.id = id;
        this.type = type;
        this.label = label;
        this.row = row;
        this.checked = false;

        this.checkbox = document.createElement('input');
        this.checkbox.type = 'checkbox';
        this.checkbox.disabled = true;

        this.checkbox.addEventListener('change', () => {
            this.checked = this.checkbox.checked;
            this.row.updateItemState();
        });
    }

    // выключение чекбокса
    disable() {
        this.checkbox.disabled = true;
    }

    // включение чекбокса
    enable() {
        this.checkbox.disabled = false;
    }

    // получение состояния чекбокса
    isChecked() {
        return this.checkbox.checked;
    }

    // отрисовка чекбокса
    render() {
        const labelElement = document.createElement('label');
        labelElement.textContent = this.label;

        const checkboxCell = document.createElement('div');
        checkboxCell.appendChild(this.checkbox);
        checkboxCell.appendChild(labelElement);

        return checkboxCell;
    }
}


class BasicRow {
    /*
        Базовый класс строки с данными в таблице с данными
    */
    constructor(data, id, column_ids, column_dict) {
        this.data = new ItemData(data, column_ids, column_dict);
        this.card = new Card(this.data, id);
        this.id = id;
    }

    // Метод отрисовки
    render(additional_cells) {
        const row = document.createElement('tr');
        
        this.data.visible_keys.forEach(key => {
            const cell = document.createElement('td');
            cell.innerHTML = this.makeTextForCell(key);
            row.appendChild(cell);
        });

        if (additional_cells) {
            additional_cells.forEach(cell => {
                row.appendChild(cell);
            });    
        }

        row.addEventListener('click', (event) => {
            // Проверка, не был ли клик по элементу, который уже имеет свой обработчик
            if (!event.target.closest('.actionable')) {
                event.preventDefault();

                const modal = new Modal('card-modal',
                                        'card-modal-body', 
                                        'card-modal-close', 
                                        () => {
                                            this.processUpdates();
                                        });
                
                this.card.setModal(modal);
                this.card.render();
            }
        });

        return row;
    }

    // Метод обработки обновлений в данных (при обновлении в модальном окне)
    processUpdates() {
        const updates = this.card.getChanges();
        if (Object.keys(updates).length > 0) {
            console.log('Updates: ', this.card.getChanges());
        }
    }

    // Метод создания надписи определенного CSS-класса
    makeCellSpan(class_name, value) {
        if (!value) return '';
        return `<span class="${class_name}">${value}</span>`
    }

    // Метод создания текста для ячейки таблицы с данными
    makeTextForCell(key) {
        const [excelValue, mtsValue, enriched_value] = this.data.getSourceDataValue(key);
        const state = this.data.getDataState();

        if (!excelValue && !mtsValue && enriched_value) {
            return this.makeCellSpan('mts-data', enriched_value);
        }
    
        if (state === 'mts-only') {
            return this.makeCellSpan('mts-data', mtsValue);
        } else if (state === 'excel-only') {
            return this.makeCellSpan('excel-data', excelValue);
        } else if (state === 'both') {
            if (excelValue && mtsValue) {
                if (excelValue === mtsValue) {
                    // Нет расхождений
                    return this.makeCellSpan('both-data', excelValue);
                } else {
                    // Расхождение
                    return `
                        <span class="discrepancy">⚠ Есть расхождения в данных!</span>
                        <br>
                        ${this.makeCellSpan('excel-data', 'excel: ' + excelValue)}
                        <br>
                        ${this.makeCellSpan('mts-data', 'база:  ' + mtsValue)}
                    `;
                }
            } else if (excelValue) {
                return `<span class="excel-data">${excelValue}</span>`;
            } else if (mtsValue) {
                return `<span class="mts-data">${mtsValue}</span>`;
            } else {
                return '';
            }
        }
    }    
}


class ActionableRow extends BasicRow {
    /*
        Класс строки с действиями (чекбоксами) в таблице с данными
    */
    constructor(data, id, column_ids, column_dict) {
        super(data, id, column_ids, column_dict);

        // Инициализация чекбоксов как объектов класса
        this.writeOffCheckbox = new Checkbox(this.id, 'write-off', 'Списать', this);
        this.putOnBalanceCheckbox = new Checkbox(this.id, 'put-on-balance', 'Поставить на учет', this);
        this.inStockCheckbox = new Checkbox(this.id, 'in-stock', 'Есть в наличии', this);
    }

    // Метод отрисовки
    render() {
        // Добавление столбца со статусом
        this.statusCell = this.createStatusCell();

        // Добавление столбца с чекбоксами
        const checkboxCell = this.createCheckboxCell();

        const row = super.render([this.statusCell, checkboxCell]);

        this.updateItemState();

        // Обновление стиля
        row.classList.add(this.data.getDataState());

        return row;
    }

    // Метод создания ячейки с чекбоксами
    createCheckboxCell() {
        const cell = document.createElement('td');
        cell.className = 'actionable';
        cell.appendChild(this.writeOffCheckbox.render());
        cell.appendChild(this.putOnBalanceCheckbox.render());
        cell.appendChild(this.inStockCheckbox.render());
        return cell;
    }

    // Метод создания ячейки статуса
    createStatusCell() {
        const cell = document.createElement('td');
        const mtsExists = this.data.mtsExists;
        const excelExists = this.data.excelExists;

        if (mtsExists && excelExists) {
            cell.textContent =  'В наличии';
        } else if (!mtsExists && excelExists) {
            cell.textContent =  'Новое';
        } else if (mtsExists && !excelExists) {
            cell.textContent =  'Можно списать';
        }
        return cell;
    }

    // Метод получения состояний чекбоксов
    getCheckboxState() {
        return {
            writeOffChecked: this.writeOffCheckbox.isChecked(),
            putOnBalanceChecked: this.putOnBalanceCheckbox.isChecked(),
            inStockChecked: this.inStockCheckbox.isChecked()
        };
    }

    // Метод обновления состояния (статуса) строки на основе чекбоксов)
    updateItemState() {
        const state = this.getCheckboxState();
        const statusCell = this.statusCell;

        const mtsExists = this.data.mtsExists;
        const excelExists = this.data.excelExists;

        // Логика обновления статуса и управления чекбоксами
        if (mtsExists) this.inStockCheckbox.enable();

        if (mtsExists && excelExists) {
            if (!state.inStockChecked) {
                statusCell.textContent = 'Утеряно';
                statusCell.style.color = 'red';
            } else {
                statusCell.textContent = 'В наличии';
                statusCell.style.color = 'grey';
            }
        } else if (!mtsExists && excelExists) {
            if (db_connected) this.putOnBalanceCheckbox.enable();
            if (!state.putOnBalanceChecked) {
                statusCell.textContent = 'Новое';
                statusCell.style.color = 'green';
            } else {
                statusCell.textContent = 'Будет поставлено на учет';
                statusCell.style.color = 'blue';
            }
        } else if (mtsExists && !excelExists) {
            if (!state.inStockChecked) {
                statusCell.textContent = state.writeOffChecked ? 'Будет списано как утраченное' : 'Можно списать как утраченное';
                statusCell.style.color = state.writeOffChecked ? 'orange' : 'red';
            } else {
                statusCell.textContent = state.writeOffChecked ? 'Будет списано' : 'Можно списать';
                statusCell.style.color = state.writeOffChecked ? 'orange' : 'red';
            }
            this.writeOffCheckbox.enable();
        }
    }
}


class Table {
    /*
        Класс для таблиц с данными
    */
    constructor(sheet_items, sheet_index, class_name, columns, actionable) {
        this.sheet_items = sheet_items;
        this.sheet_index = sheet_index;
        this.class_name = class_name;
        this.actionable = actionable;
        this.column_ids = columns.map(column => column.id);  // Сохраняем все id в отдельный список
        this.column_dict = {};
        columns.map(column => this.column_dict[column.id] = column.label);

        this.rows = [];

        sheet_items.forEach((row_data, index) => {
            let row;
            row = this.actionable ? new ActionableRow(row_data, index, this.column_ids, this.column_dict) : new BasicRow(row_data, index, this.column_ids, this.column_dict);
            this.rows.push(row);
        });
        
    }

    // Метод отрисовки
    render() {
        const table = document.createElement('table');
        table.className = this.class_name;

        // Создаем и добавляем заголовок таблицы
        table.appendChild(this.createHeader());

        this.rows.forEach(row => {
            table.appendChild(row.render());
        });
        return table;
    }

    // Метод создания заголовка таблицы
    createHeader() {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        this.column_ids.forEach(column_id => {
            const th = document.createElement('th');
            th.textContent = this.column_dict[column_id];
            headerRow.appendChild(th);
        });

        if (this.actionable) {
            const th1 = document.createElement('th');
            th1.textContent = 'Статус';
            headerRow.appendChild(th1);
            const th2 = document.createElement('th');
            th2.textContent = 'Управление';
            headerRow.appendChild(th2);
        }

        thead.appendChild(headerRow);
        return thead;
    }

    // Метод формирования массива желаемых обновлений (на основе чекбоксов)
    getUpdates() {
        return this.rows
            .filter(row => {
                const state = row.getCheckboxState();
                return state.writeOffChecked || state.putOnBalanceChecked;
            }) // Фильтрация строк, которые прошли проверку
            .map(row => {
                // Логика для сбора обновлений со всех отфильтрованных строк
                return {
                    sheetIndex: this.sheet_index,
                    itemIndex: row.id,
                    writeOff: row.writeOffCheckbox.isChecked(),
                    putOnBalance: row.putOnBalanceCheckbox.isChecked()
                };
            });
    }
}

// Функция создания таблицы с данными
function createTable(sheet_data, sheet_index, class_name, actionable){
    const table = new Table(sheet_data.items, sheet_index, class_name, sheet_data.columns, actionable);
    return [table.render(), table];
}
