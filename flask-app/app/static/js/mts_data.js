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
        const excelValue = this.excel_data && this.excel_data.hasOwnProperty(key) ? this.excel_data[key] : null;
        const mtsValue = this.mts_data && this.mts_data.hasOwnProperty(key) ? this.mts_data[key] : null;
        const enriched_data = this.enriched_data && this.enriched_data.hasOwnProperty(key) ? this.enriched_data[key] : null;

        // Возвращаем пару значений
        return [excelValue, mtsValue, enriched_data];
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
