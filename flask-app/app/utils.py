import pandas as pd
from app.source.reader import process_inventory_file

def fetch_data():
    pass

def read_excel_file(filepath):
    try:
        inventories = process_inventory_file(filepath)  # Предполагается, что эта функция возвращает структуру данных как показано

        inventory_list = []
        for inventory in inventories:
            number = inventory['Number']
            owner = inventory['Responsible Person']
            date = inventory['Reffered date']
            inventory_data = pd.DataFrame(inventory['Items'])

            # Сохраняем данные в более подходящем для работы формате
            items_data = inventory_data.to_dict(orient='records')  # Преобразуем DataFrame в список словарей

            # Сохранение результатов в список
            inventory_list.append({
                'number': number,
                'owner': owner,
                'date': date,
                'items': items_data  # сохраняем исходные данные, а не HTML
            })
        
        return 'Success', 'File successfully read', inventory_list
    except Exception as e:
        return 'Failed', str(e), []
