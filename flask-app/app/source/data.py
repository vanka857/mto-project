from datetime import datetime


class InventoryItemData:
    def __init__(self, item_name=None, inventory_number=None, unit_of_measure=None, 
                 volume=None, price=None, end_of_life=None, registration_date=None, 
                 revaluation_date=None, write_off_date=None, registration_doc_no=None, 
                 revaluation_doc_no=None, write_off_doc_no=None, num_in_inventory=None):
        self.item_name = item_name
        self.inventory_number = inventory_number
        self.unit_of_measure = unit_of_measure
        self.volume = volume
        self.price = price
        self.end_of_life = end_of_life
        self.registration_date = registration_date
        self.revaluation_date = revaluation_date
        self.write_off_date = write_off_date
        self.registration_doc_no = registration_doc_no
        self.revaluation_doc_no = revaluation_doc_no
        self.write_off_doc_no = write_off_doc_no
        self.num_in_inventory = num_in_inventory

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
            "write_off_date": self.write_off_date.strftime('%Y-%m-%d') if self.write_off_date else None, 
            "registration_doc_no": self.registration_doc_no,
            "revaluation_doc_no": self.revaluation_doc_no,
            "write_off_doc_no": self.write_off_doc_no,
            "num_in_inventory": self.num_in_inventory
        }

    @staticmethod
    def from_excel(excel_object):
        return InventoryItemData(
            item_name=excel_object['Name'],
            inventory_number=excel_object['Inventory Number'],
            unit_of_measure=excel_object['Measure'],
            volume=excel_object['Volume'],
            price=excel_object['Price'],
            num_in_inventory=excel_object['Number']
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
            write_off_date=mts_object.write_off_date,
            registration_doc_no=mts_object.registration_doc_no,
            revaluation_doc_no=mts_object.revaluation_doc_no,
            write_off_doc_no=mts_object.write_off_doc_no
        )


class InventoryItem:
    def __init__(self, excel_object=None, mts_object=None, parent_inventory=None, MTS=None, db=None):
        self.excel_data = InventoryItemData.from_excel(excel_object) if excel_object else None
        self.mts_data = InventoryItemData.from_mts(mts_object) if mts_object else None
        self.parent_inventory = parent_inventory
        self.MTS = MTS
        self.db = db

    def add_mts_data(self, mts_object, MTS=None, db=None):
        self.mts_data = InventoryItemData.from_mts(mts_object)
        if MTS is not None:
            self.MTS = MTS 
        if db is not None:
            self.db = db

    def add_excel_data(self, mts_object):
        self.excel_data = InventoryItemData.from_excel(mts_object)

    def write_off(self):
        if self.mts_data:
            mts_entry = self.MTS.query.filter_by(inventory_number=self.mts_data.inventory_number).first()
            if mts_entry:
                mts_entry.write_off_doc_no = self.parent_inventory.number
                mts_entry.write_off_date = self.parent_inventory.date
                self.db.session.commit()

    def put_on_balance(self):
        if self.excel_data:
            new_mts = self.MTS(
                item_name=self.excel_data.item_name,
                inventory_number=self.excel_data.inventory_number,
                unit_of_measure=self.excel_data.unit_of_measure,
                volume=self.excel_data.volume,
                price=self.excel_data.price,
                registration_doc_no=self.parent_inventory.number,
                registration_date=self.parent_inventory.date
            )
            self.db.session.add(new_mts)
            self.db.session.commit()

    def to_dict(self):
        return {
            "excel_data": self.excel_data.to_dict() if self.excel_data else {},
            "mts_data": self.mts_data.to_dict() if self.mts_data else {},
        }
    

class InventorySheet:
    def __init__(self, date=None, number=None):
        self.items = []  # Список элементов InventoryItem
        self.date = date
        self.number = number

    def add_item(self, item):
        self.items.append(item)

    def to_dict(self):
        return {
            "date": self.date.strftime('%Y-%m-%d') if self.date else None, 
            "number": self.number,
            "items": [item.to_dict() for item in self.items]
        }
