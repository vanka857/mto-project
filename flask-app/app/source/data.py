from flask_marshmallow import Marshmallow
from ..schemas import MTSSchema


ma = Marshmallow()
mts_schema = MTSSchema()


class InventoryExcelItemData:
    def __init__(self, excel_object):
        self.excel_object = excel_object
        self.dict = {
            "item_name": self.excel_object['Name'],
            "inventory_number": self.excel_object['Inventory Number'],
            "unit_of_measure": self.excel_object['Measure'],
            "volume": self.excel_object['Volume'],
            "price": self.excel_object['Price'],
            "number_excel": self.excel_object['Number'],
        }

    def to_dict(self):
        return self.dict


class InventoryItem:
    def __init__(self, excel_object=None, mts_object=None, parent_inventory=None, enriched_data_dict=None):
        self.excel_data = InventoryExcelItemData(excel_object) if excel_object else None
        self.mts_object = mts_object
        self.parent_inventory = parent_inventory
        self.enriched_data_dict = enriched_data_dict

    def add_mts_data(self, mts_object):
        self.mts_object = mts_object

    def add_excel_data(self, excel_object):
        self.excel_data = InventoryExcelItemData(excel_object)

    def write_off(self, MTS, db, doc_no=None, date=None):
        if self.mts_object:
            if doc_no:
                self.mts_object.write_off_doc_no = doc_no
            if date:
                self.mts_object.write_off_date = date
            self.mts_object.written_off = True

            db.session.add(self.mts_object)
            db.session.commit()

    def put_on_balance(self, MTS, db):
        if self.excel_data:
            new_mts = MTS(
                item_name=self.excel_data.dict['item_name'],
                inventory_number=self.excel_data.dict['inventory_number'],
                unit_of_measure=self.excel_data.dict['unit_of_measure'],
                volume=self.excel_data.dict['volume'],
                price=self.excel_data.dict['price'],
                registration_doc_no=self.parent_inventory.number,
                registration_date=self.parent_inventory.date
            )
            db.session.add(new_mts)
            db.session.commit()

            self.mts_object = new_mts

    def to_dict(self):
        mts_data_dict = {}

        if self.mts_object:
            mts_data_dict.update(mts_schema.dump(self.mts_object))
            
            appointments = self.mts_object.appointments
            if len(appointments) > 0 :
                mts_data_dict['responsible_surname'] = appointments[0].owner.surname
                mts_data_dict['latest_appointment_date_time'] = appointments[0].date_time.strftime('%Y-%m-%d %H:%M:%S')
            
            movements = self.mts_object.movements
            if len(movements) > 0 :
                mts_data_dict['room_name'] = movements[0].room.name_
                mts_data_dict['latest_movement_date_time'] = movements[0].date_time.strftime('%Y-%m-%d %H:%M:%S')

            category = self.mts_object.category
            if category:
                mts_data_dict['category_name'] = category.name

        return {
            "excel_data": self.excel_data.to_dict() if self.excel_data else {},
            "mts_data": mts_data_dict,
            "enriched_data": self.enriched_data_dict
        }
    

class BasicSheet:
    def __init__(self, columns=None):
        self.columns = columns
        self.items = []  # Список элементов InventoryItem

    def add_item(self, item):
        self.items.append(item)

    def to_dict(self):
        return {
            "columns": [column.to_dict() for column in self.columns],  # Преобразуем каждый объект Column в словарь
            "items": [item.to_dict() for item in self.items]
        }


class InventorySheet(BasicSheet):
    def __init__(self, columns=None, date=None, number=None, name=None):
        super().__init__(columns)  # Исправлено: вызов конструктора базового класса

        self.date = date
        self.number = number
        self.name = name

    def to_dict(self):
        base_dict = super().to_dict()  # Исправлено: корректный вызов метода базового класса
        base_dict.update({  # Используем метод `update` для добавления данных
            "name": self.name,
            "date": self.date.strftime('%Y-%m-%d') if self.date else None,
            "number": self.number
        })
        return base_dict


class Column:
    def __init__(self, id, label) -> None:
        self.id = id
        self.label = label

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label
        }
