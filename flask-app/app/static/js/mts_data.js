// Файл с классом, предназначенным для хранения данных о МТС


class ItemData {
    /*
        Класс для хранения данных о МТС
    */
    constructor(data, visible_keys, keys_dict) {
        this.excel_data = data.excel_data;
        this.mts_data = data.mts_data;
        this.enriched_data = data.enriched_data;

        this.excelExists = !is_empty(data.excel_data);
        this.mtsExists = !is_empty(data.mts_data);

        this.visible_keys = visible_keys;
        this.keys_dict = keys_dict;
    }

    // Метод, возвращающий данные по ключу из трех источников
    getSourceDataValue(key) {
        // Получаем значения по ключу из обоих словарей, если значение отсутствует, присваиваем пустую строку
        const excel_value = this.excel_data && this.excel_data.hasOwnProperty(key) ? this.excel_data[key] : null;
        const mts_value = this.mts_data && this.mts_data.hasOwnProperty(key) ? this.mts_data[key] : null;
        const enriched_value = this.enriched_data && this.enriched_data.hasOwnProperty(key) ? this.enriched_data[key] : null;

        // Возвращаем пару значений
        return [excel_value, mts_value, enriched_value];
    }

    // Метод, возвращающий данные по ключу из трех источников
    getSourceDataValueOne(key) {
        const [excel_value, mts_value, enriched_value] = this.getSourceDataValue(key);

        if (excel_value) return excel_value;
        if (mts_value) return mts_value;
        return enriched_value;
    }

    // Метод, возвращающий состояние DataItem (по наличию данных в excel и базе)
    getDataState() {
        if (this.mtsExists && !this.excelExists) {
            return 'mts-only';
        } else if (!this.mtsExists && this.excelExists) {
            return 'excel-only';
        } else if (this.mtsExists && this.excelExists) {
            return 'both';
        }
    }

    // putOnBalance() {}
    // writeOff() {}
    // changeData() {}
    // getUpdates() {}
}
