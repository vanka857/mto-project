from flask import Blueprint, render_template, request, session, jsonify, current_app, redirect, url_for
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from sqlalchemy.orm import subqueryload
from sqlalchemy import or_, func
from .models import db, MTS, Room, Staff, Movement, Appointment
from .forms import SearchForm
from .source.reader import read_excel_file
from .source.data import InventoryItem, InventorySheet, BasicSheet, Column


bp = Blueprint('main', __name__)
app_title = 'Материально-техническое обеспечение 0.1.1'

inventory_columns_to_show = [
    Column('number_excel', 'Номер в ведомости'),
    Column('id', 'Номер в базе'),
    Column('inventory_number', 'Инвентарный номер'),
    Column('item_name', 'Наименование'),
    Column('unit_of_measure', 'Единица измерения'),
    Column('volume', 'Количество'),
    Column('price', 'Стоимость'),
    Column('registration_date', 'Дата постановки на учет'),
    Column('registration_doc_no', 'Документ постановки на учет'),
    Column('responsible_surname', 'Ответственный'),
    Column('room_name', 'Помещение')
]

search_columns_to_show = [
    Column('id', 'Номер в базе'),
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

    return render_template('navigator.html', app_title=app_title, page_title="поиск", form=form)

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

    if form.validate_on_submit():
        
        # Получение фильтров из формы
        query = form.name_or_inventory_number.data
        # Фильтрация сотрудников, если указана фамилия
        staff_surname = form.responsible.data if form.responsible.data else None
        # Фильтрация помещений, если указано название
        room_name = form.location.data if form.location.data else None

        # Подзапрос для получения последних назначений
        latest_appointment_subquery = (
            db.session.query(
                Appointment.mts_id,
                func.max(Appointment.date_time).label('latest_date')
            ).group_by(Appointment.mts_id).subquery()
        )

        # Подзапрос для получения ID последних назначений
        latest_appointment_id_subquery = (
            db.session.query(
                Appointment.id.label('appointment_id'),
                Appointment.mts_id
            ).join(
                latest_appointment_subquery,
                (Appointment.mts_id == latest_appointment_subquery.c.mts_id) &
                (Appointment.date_time == latest_appointment_subquery.c.latest_date)
            ).subquery()
        )

        # Подзапрос для получения последних перемещений
        latest_movement_subquery = (
            db.session.query(
                Movement.mts_id,
                func.max(Movement.date_time).label('latest_date')
            ).group_by(Movement.mts_id).subquery()
        )

        # Подзапрос для получения ID последних перемещений
        latest_movement_id_subquery = (
            db.session.query(
                Movement.id.label('movement_id'),
                Movement.mts_id
            ).join(
                latest_movement_subquery,
                (Movement.mts_id == latest_movement_subquery.c.mts_id) &
                (Movement.date_time == latest_movement_subquery.c.latest_date)
            ).subquery()
        )

        # Основной запрос с подзапросами
        mts_query = db.session.query(MTS).options(
            subqueryload(MTS.movements).subqueryload(Movement.room),
            subqueryload(MTS.appointments).subqueryload(Appointment.owner)
        ).outerjoin(
            latest_appointment_id_subquery,
            (MTS.id == latest_appointment_id_subquery.c.mts_id)
        ).outerjoin(
            Appointment,
            Appointment.id == latest_appointment_id_subquery.c.appointment_id
        ).outerjoin(
            latest_movement_id_subquery,
            (MTS.id == latest_movement_id_subquery.c.mts_id)
        ).outerjoin(
            Movement,
            Movement.id == latest_movement_id_subquery.c.movement_id
        )

        # Применение фильтров
        if staff_surname:
            mts_query = mts_query.filter(Appointment.owner.has(Staff.surname == staff_surname))

        if room_name:
            mts_query = mts_query.filter(Movement.room.has(Room.name_ == room_name))

        if query:
            mts_query = mts_query.filter(
                or_(
                    MTS.item_name.ilike(f'%{query}%'),
                    MTS.inventory_number.ilike(f'{query}%')
                )
            )

        # Добавление алиасов для полей сортировки
        mts_query = mts_query.outerjoin(
            Staff, Staff.id == Appointment.owner_id
        ).outerjoin(
            Room, Room.id == Movement.room_id
        )

        # Сортировка по фамилии и названию комнаты
        mts_query = mts_query.order_by(
            Staff.surname,
            Room.name_
        )

        # Выполнение запроса
        results = mts_query.all()

        # Создание и заполнение листа
        sheet = BasicSheet(columns=search_columns_to_show)

        for mts in results:
            sheet.add_item(InventoryItem(mts_object=mts))

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
            inventory_number = item.excel_data.dict['inventory_number']    
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
