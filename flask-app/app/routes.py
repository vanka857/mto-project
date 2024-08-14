from flask import Blueprint, render_template, request, session, jsonify, current_app, redirect, url_for
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from sqlalchemy.orm import aliased
from sqlalchemy import func
from .utils import read_excel_file
from .models import db, MTS, Room, Staff, Movement, Appointment
from .forms import SearchForm
from .source.data import InventoryItem, InventorySheet, BasicSheet, Column


bp = Blueprint('main', __name__)
app_title = 'Материально-техническое обеспечение 0.1.1'

inventory_columns_to_show = [
    Column('number_excel', 'Номер в ведомости'),
    Column('number_mts', 'Номер в базе'),
    Column('inventory_number', 'Инвентарный номер'),
    Column('item_name', 'Наименование'),
    Column('unit_of_measure', 'Единица измерения'),
    Column('volume', 'Количество'),
    Column('price', 'Стоимость'),
    Column('registration_date', 'Дата постановки на учет'),
    Column('registration_doc_no', 'Документ постановки на учет'),
    Column('write_off_date', 'Дата списания'),
    Column('write_off_doc_no', 'Документ списания'),
]

search_columns_to_show = [
    Column('number_mts', 'Номер в базе'),
    Column('inventory_number', 'Инвентарный номер'),
    Column('item_name', 'Наименование'),
    Column('unit_of_measure', 'Единица измерения'),
    Column('volume', 'Количество'),
    Column('registration_date', 'Дата постановки на учет'),
    Column('registration_doc_no', 'Документ постановки на учет'),
    Column('responsible_surname', 'Ответственный'),
    Column('latest_appointment_date_time', 'Дата назначения ответственного'),
    Column('room_name', 'Помещение'),
    Column('latest_movement_date_time', 'Дата перемещения в помещение'),
]

@bp.route('/')
def home_page():
    # Редирект с корневого URL на подстраницу
    return redirect(url_for('main.fetch'))

@bp.route('/fetch')
def fetch():
    return render_template('fetch.html', app_title=app_title, page_title='внесение данных')

@bp.route('/navigator', methods=['GET', 'POST'])
def navigator():
    form = SearchForm()

    # Заполнение списка выборов
    form.responsible.choices = [('', 'Не выбрано')] + [
        (s.surname, s.surname) for s in db.session.query(Staff.surname).distinct().order_by(Staff.surname)
    ]
    form.location.choices = [('', 'Не выбрано')] + [
        (r.name_, r.name_) for r in db.session.query(Room.name_).distinct().order_by(Room.name_)
    ]

    return render_template('navigator.html', app_title="Поиск", page_title="Поиск", form=form)

@bp.route('/navigator/search', methods=['POST'])
def search():
    form = SearchForm()

    # Получаем список уникальных фамилий ответственных и названий помещений
    form.responsible.choices = [('', 'Не выбрано')] + [
        (s.surname, s.surname) for s in db.session.query(Staff.surname).distinct()
    ]
    form.location.choices = [('', 'Не выбрано')] + [
        (r.name_, r.name_) for r in db.session.query(Room.name_).distinct()
    ]

    results = None

    if form.validate_on_submit():
        responsible_surname = form.responsible.data
        location_name = form.location.data
        query = form.name_or_inventory_number.data

        # Алиасы для таблиц
        latest_appointment = aliased(Appointment)
        latest_movement = aliased(Movement)

        # Подзапрос для получения последнего назначения ответственного для каждого MTS
        appointment_subquery = db.session.query(
            Appointment.mts_id,
            func.max(Appointment.date_time).label('latest_date')
        ).group_by(Appointment.mts_id).subquery()

        # Подзапрос для получения последнего перемещения для каждого MTS
        movement_subquery = db.session.query(
            Movement.mts_id,
            func.max(Movement.date_time).label('latest_date')
        ).group_by(Movement.mts_id).subquery()

        # Основной запрос с JOIN и фильтрацией
        filters = []

        # Фильтрация по фамилии ответственного
        if responsible_surname:
            filters.append(Staff.surname == responsible_surname)

        # Фильтрация по названию помещения
        if location_name:
            filters.append(Room.name_ == location_name)

        if query:
            filters.append((MTS.item_name.ilike(f'{query}%')) | (MTS.inventory_number.ilike(f'{query}%')))

        responsible_surname_label = 'responsible_surname'
        latest_appointment_date_time_label = 'latest_appointment_date_time'
        room_name_label = 'room_name'
        latest_movement_date_time_label = 'latest_movement_date_time'

        results = db.session.query(MTS, 
                                   Staff.surname.label(responsible_surname_label),
                                   latest_appointment.date_time.label(latest_appointment_date_time_label),
                                   Room.name_.label(room_name_label),
                                   latest_movement.date_time.label(latest_movement_date_time_label)
        ).join(
            appointment_subquery,
            appointment_subquery.c.mts_id == MTS.id
        ).join(
            latest_appointment,
            (latest_appointment.mts_id == MTS.id) &
            (latest_appointment.date_time == appointment_subquery.c.latest_date)
        ).join(
            Staff,
            Staff.id == latest_appointment.owner_id
        ).join(
            movement_subquery,
            movement_subquery.c.mts_id == MTS.id
        ).join(
            latest_movement,
            (latest_movement.mts_id == MTS.id) &
            (latest_movement.date_time == movement_subquery.c.latest_date)
        ).join(
            Room,
            Room.id == latest_movement.room_id
        ).filter(*filters
        ).order_by(Staff.surname, Room.name_).all()

        sheet = BasicSheet(columns=search_columns_to_show)
        for result in results:
            enriched_data_dict = {responsible_surname_label: result[1],
                                  latest_appointment_date_time_label: result[2].strftime('%Y-%m-%d %H:%M:%S'),
                                  room_name_label: result[3],
                                  latest_movement_date_time_label: result[4].strftime('%Y-%m-%d %H:%M:%S')}
            sheet.add_item(InventoryItem(mts_object=result[0], enriched_data_dict=enriched_data_dict))

    return return_data_as_dict([sheet], 'success', f'Найдено {len(sheet.items)} резальтатов!')

@bp.route('/fetch/upload', methods=['POST'])
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

@bp.route('/fetch/read', methods=['GET'])
def read():
    filepath = session.get('file_path')
    if filepath:
        status, message, inventories_excel_row_data = read_excel_file(filepath)

        inventories = []

        for inventory_excel_row_data in inventories_excel_row_data:
            inventory = InventorySheet(
                date=datetime.strptime(inventory_excel_row_data['date'], "%d.%m.%Y").date(),
                number=inventory_excel_row_data['number'],
                columns=inventory_columns_to_show)
            
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

@bp.route('/fetch/update-inventory', methods=['POST'])
def update_inventory():
    def process_update(update, inventories, not_founded_sheet):
        sheetIndex = int(update['sheetIndex'])
        itemIndex = int(update['itemIndex'])
        
        sheet = None
        if sheetIndex >= len(inventories):
            if not_founded_sheet:
                sheet = not_founded_sheet
            else: 
                print('Error', not_founded_sheet)
        else:
            sheet = inventories[sheetIndex]

        # Логика обработки изменений
        if update.get('writeOff'):
            print(f"Списание актива с ID: {sheetIndex}-{itemIndex}")
            sheet.items[itemIndex].write_off(MTS, db)
        if update.get('putOnBalance'):
            print(f"Постановка на учет актива с ID: {sheetIndex}-{itemIndex}")
            sheet.items[itemIndex].put_on_balance(MTS, db)

    updates = request.get_json().get('updates', [])
    
    if updates:
        inventories = session.get('inventories')
        not_founded_sheet = session.get('not_founded_sheet')
        for update in updates:
            process_update(update, inventories, not_founded_sheet)
        return jsonify({'success': True, 'message': 'Изменения успешно обработаны'})
    else:
        return jsonify({'success': False, 'message': 'Нет данных для обработки'}), 400

@bp.route('/fetch/fetch-from-db', methods=['GET'])
def fetch_from_db():
    inventories = session.get('inventories')

    if not inventories:
        return jsonify({'error': 'No data available. Please upload and read file first.'}), 400

    found = 0
    founded_inv_numbers = []
    for inventory in inventories:
        for item in inventory.items:
            inventory_number = item.excel_data.inventory_number    
            db_item = MTS.query \
                .filter(MTS.inventory_number == inventory_number, MTS.written_off == False) \
                .first()
            
            if db_item:
                founded_inv_numbers.append(inventory_number)
                found += 1
                item.add_mts_data(
                    mts_object=db_item
                )
    
    not_founded_items = MTS.query \
        .filter(MTS.inventory_number.notin_(founded_inv_numbers), MTS.written_off == False) \
        .order_by(MTS.item_name).all()
    
    not_founded_sheet = InventorySheet(name='Не найденное',
                                       columns=inventory_columns_to_show)

    for not_founded_item in not_founded_items:
        not_founded_sheet.add_item(
            InventoryItem(mts_object=not_founded_item))
        
    session['not_founded_sheet'] = not_founded_sheet

    inventories_to_send = inventories + [not_founded_sheet]

    return return_data_as_dict(inventories_to_send, 'Fetched success!', f'{found} Elements were fetched!')
