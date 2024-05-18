from datetime import datetime


class InventoryItemData:
    def __init__(self, item_name=None, inventory_number=None, unit_of_measure=None, 
                 volume=None, price=None, end_of_life=None, registration_date=None, 
                 revaluation_date=None, written_off=None, write_off_date=None, registration_doc_no=None, 
                 revaluation_doc_no=None, write_off_doc_no=None, number=None):
        self.item_name = item_name
        self.inventory_number = inventory_number
        self.unit_of_measure = unit_of_measure
        self.volume = volume
        self.price = price
        self.end_of_life = end_of_life
        self.registration_date = registration_date
        self.revaluation_date = revaluation_date
        self.written_off = written_off
        self.write_off_date = write_off_date
        self.registration_doc_no = registration_doc_no
        self.revaluation_doc_no = revaluation_doc_no
        self.write_off_doc_no = write_off_doc_no
        self.number = number

    def to_dict(self):
        return {
            "item_name": self.item_name,
            "inventory_number": self.inventory_number,
            "unit_of_measure": self.unit_of_measure,
            "volume": self.volume,
            "price": self.price,
            "end_of_life": self.end_of_life.strftime('%Y-%m-%d %H:%M:%S') if self.end_of_life else None, 
            "registration_date": self.registration_date.strftime('%Y-%m-%d') if self.registration_date else None, 
            "revaluation_date": self.revaluation_date.strftime('%Y-%m-%d') if self.revaluation_date else None, 
            "written_off": self.written_off,
            "write_off_date": self.write_off_date.strftime('%Y-%m-%d') if self.write_off_date else None, 
            "registration_doc_no": self.registration_doc_no,
            "revaluation_doc_no": self.revaluation_doc_no,
            "write_off_doc_no": self.write_off_doc_no,
            "number": self.number
        }

    @staticmethod
    def from_excel(excel_object):
        return InventoryItemData(
            item_name=excel_object['Name'],
            inventory_number=excel_object['Inventory Number'],
            unit_of_measure=excel_object['Measure'],
            volume=excel_object['Volume'],
            price=excel_object['Price'],
            number=excel_object['Number']
        )

    @staticmethod
    def from_mts(mts_object):
        return InventoryItemData(
            item_name=mts_object.item_name,
            inventory_number=mts_object.inventory_number,
            unit_of_measure=mts_object.unit_of_measure,
            volume=mts_object.volume,
            price=mts_object.price,
            end_of_life=mts_object.end_of_life,
            registration_date=mts_object.registration_date,
            revaluation_date=mts_object.revaluation_date,
            written_off=mts_object.written_off,
            write_off_date=mts_object.write_off_date,
            registration_doc_no=mts_object.registration_doc_no,
            revaluation_doc_no=mts_object.revaluation_doc_no,
            write_off_doc_no=mts_object.write_off_doc_no,
            number=mts_object.id
        )


class InventoryItem:
    def __init__(self, excel_object=None, mts_object=None, parent_inventory=None):
        self.excel_data = InventoryItemData.from_excel(excel_object) if excel_object else None
        self.mts_data = InventoryItemData.from_mts(mts_object) if mts_object else None
        self.parent_inventory = parent_inventory

    def add_mts_data(self, mts_object):
        self.mts_data = InventoryItemData.from_mts(mts_object)

    def add_excel_data(self, mts_object):
        self.excel_data = InventoryItemData.from_excel(mts_object)

    def write_off(self, MTS, db, doc_no=None, date=None):
        if self.mts_data:
            mts_entry = MTS.query.get(self.mts_data.number)
            if mts_entry:
                if doc_no:
                    mts_entry.write_off_doc_no = doc_no
                if date:
                    mts_entry.write_off_date = date
                mts_entry.written_off = True
                db.session.commit()

    def put_on_balance(self, MTS, db):
        if self.excel_data:
            new_mts = MTS(
                item_name=self.excel_data.item_name,
                inventory_number=self.excel_data.inventory_number,
                unit_of_measure=self.excel_data.unit_of_measure,
                volume=self.excel_data.volume,
                price=self.excel_data.price,
                registration_doc_no=self.parent_inventory.number,
                registration_date=self.parent_inventory.date
            )
            db.session.add(new_mts)
            db.session.commit()

    def to_dict(self):
        return {
            "excel_data": self.excel_data.to_dict() if self.excel_data else {},
            "mts_data": self.mts_data.to_dict() if self.mts_data else {},
        }
    

class InventorySheet:
    def __init__(self, date=None, number=None, name=None):
        self.items = []  # Список элементов InventoryItem
        self.date = date
        self.number = number
        self.name = name

    def add_item(self, item):
        self.items.append(item)

    def to_dict(self):
        return {
            "name": self.name,
            "date": self.date.strftime('%Y-%m-%d') if self.date else None, 
            "number": self.number,
            "items": [item.to_dict() for item in self.items]
        }
