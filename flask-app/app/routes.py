from flask import Blueprint, render_template, request, session, jsonify, current_app
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from .utils import read_excel_file
from .models import db, MTS
from .source.data import InventoryItem, InventorySheet

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and (file.filename.endswith('.xls') or file.filename.endswith('.xlsx')):
        filename = secure_filename(file.filename)
        folder = current_app.config['UPLOAD_FOLDER']

        if not os.path.exists(folder):
            os.makedirs(folder)

        filepath = os.path.join(folder, filename)
        file.save(filepath)

        session['file_path'] = filepath
        return jsonify({'filename': filename})
    return jsonify({'error': 'Invalid file type'}), 400

@bp.route('/read', methods=['GET'])
def read():
    filepath = session.get('file_path')
    if filepath:
        status, message, inventories_excel_row_data = read_excel_file(filepath)

        inventories = []

        for inventory_excel_row_data in inventories_excel_row_data:
            inventory = InventorySheet(
                date=datetime.strptime(inventory_excel_row_data['date'], "%d.%m.%Y").date(),
                number=inventory_excel_row_data['number'])
            
            for inventory_item_excel_data in inventory_excel_row_data['items']:
                inventory.add_item(InventoryItem(
                    excel_object=inventory_item_excel_data,
                    parent_inventory = inventory,
                ))

            inventories.append(inventory)

        # Сохраняем прочитанные данные в сессию
        session['inventories'] = inventories

        return return_data_as_dict(inventories, status, message)
    return jsonify({'error': 'No file uploaded'}), 400
    

def return_data_as_dict(data, status=None, message=None):
    sheets_data = [sheet.to_dict() for sheet in data]
    return jsonify({'status': status, 'message': message, 'inventories': sheets_data})

@bp.route('/update-inventory', methods=['POST'])
def update_inventory():
    updates = request.get_json().get('updates', [])
    
    if updates:
        inventories = session.get('inventories')
        for update in updates:
            process_update(update, inventories)
        return jsonify({'success': True, 'message': 'Изменения успешно обработаны'})
    else:
        return jsonify({'success': False, 'message': 'Нет данных для обработки'}), 400

def process_update(update, inventories):
    sheetIndex = int(update['sheetIndex'])
    itemIndex = int(update['itemIndex'])

    # Логика обработки изменений
    if update.get('writeOff'):
        print(f"Списание актива с ID: {sheetIndex}-{itemIndex}")
        inventories[sheetIndex].items[itemIndex].write_off()
    if update.get('putOnBalance'):
        print(f"Постановка на учет актива с ID: {sheetIndex}-{itemIndex}")
        inventories[sheetIndex].items[itemIndex].put_on_balance(MTS, db)

@bp.route('/fetch-from-db', methods=['GET'])
def fetch_from_db():
    inventories = session.get('inventories')

    if not inventories:
        return jsonify({'error': 'No data available. Please upload and read file first.'}), 400

    found = 0
    for inventory in inventories:
        for item in inventory.items:
            db_item = MTS.query.filter_by(inventory_number=item.excel_data.inventory_number).first()
            
            if db_item:
                found += 1
                item.add_mts_data(
                    mts_object=db_item
                )

    return return_data_as_dict(inventories, 'Fetched success!', f'{found} Elements were fetched!')
