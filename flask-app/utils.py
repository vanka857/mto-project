from app import db, create_app
from app.models import MTS, Department, Room, Staff, Appointment, Movement
from datetime import datetime, timedelta


app = create_app()

with app.app_context():

    def fill_db():
        # Вставка тестовых данных в таблицу Department
        department1 = Department(name_='ВУЦ МФТИ')
        department2 = Department(name_='Отдел №1', parent=department1)
        department3 = Department(name_='Отдел №2', parent=department1)

        db.session.add_all([department1, department2, department3])
        db.session.commit()

        # Вставка тестовых данных в таблицу Room
        rooms = [
            Room(name_='Кабинет 101', purpose='Конференц-зал', address='ул. Ленина, д. 123'),
            Room(name_='Кабинет 102', purpose='Офис', address='пр. Победы, д. 456'),
            Room(name_='Кабинет 103', purpose='Склад', address='ул. Советская, д. 789'),
            Room(name_='Кабинет 104', purpose='Лаборатория', address='пр. Пушкина, д. 321'),
            Room(name_='Кабинет 105', purpose='Переговорная', address='ул. Гагарина, д. 654')
        ]

        db.session.add_all(rooms)
        db.session.commit()

        # Вставка тестовых данных в таблицу Staff
        staff_members = [
            Staff(surname='Иванов', name_='Иван', patronymic='Иванович', position='Начальник ВУЦ', rank='Полковник', department_id=department1.id),
            Staff(surname='Петров', name_='Петр', patronymic='Петрович', position='Начальник цикла военной подготовки', rank='Полковник', department_id=department1.id),
            Staff(surname='Сидоров', name_='Сидор', patronymic='Сидорович', position='Преподаватель', rank='Подполковник', department_id=department1.id),
            Staff(surname='Кузнецова', name_='Елена', patronymic='Александровна', position='Преподаватель', rank='Майор', department_id=department1.id),
            Staff(surname='Смирнов', name_='Михаил', patronymic='Сергеевич', position='Техник', department_id=department2.id)
        ]

        db.session.add_all(staff_members)
        db.session.commit()

        # Вставка тестовых данных в таблицу MTS
        mts_items = [
            MTS(item_name='Брошюровщик Renz SRW 360, без орг., 25л./120л.мет.пруж', inventory_number='41013417818', unit_of_measure='шт.', price=54950, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Тележка гидравлическая MEWA MW 20, 2000кг, 1150x550', inventory_number='410136188249', unit_of_measure='шт.', price=18000, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Уничтожитель документов HSM Securio AF150 4.5x30,4 ур.секр., 12лист, 34л', inventory_number='410134178539', unit_of_measure='шт.', price=49990, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Уничтожитель документов HSM Securio AF150 4.5x30,4 ур.секр., 12лист, 34л', inventory_number='410134178540', unit_of_measure='шт.', price=49990, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Уничтожитель документов HSM Securio AF150 4.5x30,4 ур.секр., 12лист, 34л', inventory_number='410134178620', unit_of_measure='шт.', price=49990, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Лампа оригинальная смодулем', inventory_number='410136200788', unit_of_measure='шт.', price=12017, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Принтер офисный HP LaserJet Pro', inventory_number='410200001001', unit_of_measure='шт.', price=20500, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Кофемашина DeLonghi Magnifica S', inventory_number='410200001002', unit_of_measure='шт.', price=45500, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Сканер документов Canon ScanJet', inventory_number='410200001003', unit_of_measure='шт.', price=8900, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Монитор Dell UltraSharp 27"', inventory_number='410200001004', unit_of_measure='шт.', price=37000, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525'),
            MTS(item_name='Клавиатура механическая Logitech G915', inventory_number='410200001005', unit_of_measure='шт.', price=12990, registration_date=datetime(2022, 3, 27), registration_doc_no='0000-000525')
        ]

        db.session.add_all(mts_items)
        db.session.commit()

        # Вставка тестовых данных в таблицу Appointment
        now = datetime.now()
        appointments = [
            Appointment(mts_id=1, owner_id=1, old_owner_id=None, date_time=now - timedelta(days=10), reason='Initial assignment'),
            Appointment(mts_id=1, owner_id=2, old_owner_id=1, date_time=now - timedelta(days=5), reason='Reassigned due to role change'),
            Appointment(mts_id=2, owner_id=2, old_owner_id=None, date_time=now - timedelta(days=15), reason='Initial assignment'),
            Appointment(mts_id=2, owner_id=1, old_owner_id=2, date_time=now - timedelta(days=8), reason='Reassigned to new project'),
            Appointment(mts_id=3, owner_id=2, old_owner_id=None, date_time=now - timedelta(days=20), reason='Initial assignment'),
            Appointment(mts_id=3, owner_id=1, old_owner_id=2, date_time=now - timedelta(days=12), reason='Reassigned due to relocation'),
            Appointment(mts_id=4, owner_id=1, old_owner_id=None, date_time=now - timedelta(days=25), reason='Initial assignment'),
            Appointment(mts_id=4, owner_id=3, old_owner_id=1, date_time=now - timedelta(days=10), reason='Reassigned to new department'),
            Appointment(mts_id=5, owner_id=3, old_owner_id=None, date_time=now - timedelta(days=30), reason='Initial assignment'),
            Appointment(mts_id=5, owner_id=2, old_owner_id=3, date_time=now - timedelta(days=15), reason='Reassigned to new role'),
            Appointment(mts_id=6, owner_id=1, old_owner_id=None, date_time=now - timedelta(days=10), reason='Initial assignment'),
            Appointment(mts_id=6, owner_id=2, old_owner_id=1, date_time=now - timedelta(days=5), reason='Reassigned due to role change'),
            Appointment(mts_id=7, owner_id=2, old_owner_id=None, date_time=now - timedelta(days=15), reason='Initial assignment'),
            Appointment(mts_id=7, owner_id=1, old_owner_id=2, date_time=now - timedelta(days=8), reason='Reassigned to new project'),
            Appointment(mts_id=8, owner_id=2, old_owner_id=None, date_time=now - timedelta(days=20), reason='Initial assignment'),
            Appointment(mts_id=8, owner_id=1, old_owner_id=2, date_time=now - timedelta(days=12), reason='Reassigned due to relocation'),
            Appointment(mts_id=9, owner_id=1, old_owner_id=None, date_time=now - timedelta(days=25), reason='Initial assignment'),
            Appointment(mts_id=9, owner_id=3, old_owner_id=1, date_time=now - timedelta(days=10), reason='Reassigned to new department'),
            Appointment(mts_id=10, owner_id=3, old_owner_id=None, date_time=now - timedelta(days=30), reason='Initial assignment'),
            Appointment(mts_id=10, owner_id=2, old_owner_id=3, date_time=now - timedelta(days=15), reason='Reassigned to new role')
        ]

        db.session.add_all(appointments)
        db.session.commit()

        # Вставка тестовых данных в таблицу Movement
        movements = [
            Movement(mts_id=1, room_id=1, old_room_id=None, date_time=now - timedelta(days=12), person_id=1),
            Movement(mts_id=1, room_id=2, old_room_id=1, date_time=now - timedelta(days=6), person_id=1),
            Movement(mts_id=2, room_id=2, old_room_id=None, date_time=now - timedelta(days=18), person_id=3),
            Movement(mts_id=2, room_id=3, old_room_id=2, date_time=now - timedelta(days=9), person_id=3),
            Movement(mts_id=3, room_id=3, old_room_id=None, date_time=now - timedelta(days=22), person_id=2),
            Movement(mts_id=3, room_id=1, old_room_id=3, date_time=now - timedelta(days=11), person_id=2),
            Movement(mts_id=4, room_id=2, old_room_id=None, date_time=now - timedelta(days=27), person_id=2),
            Movement(mts_id=4, room_id=1, old_room_id=2, date_time=now - timedelta(days=13), person_id=2),
            Movement(mts_id=5, room_id=3, old_room_id=None, date_time=now - timedelta(days=32), person_id=2),
            Movement(mts_id=5, room_id=1, old_room_id=3, date_time=now - timedelta(days=18), person_id=2),
            Movement(mts_id=6, room_id=1, old_room_id=None, date_time=now - timedelta(days=12), person_id=1),
            Movement(mts_id=6, room_id=2, old_room_id=1, date_time=now - timedelta(days=6), person_id=1),
            Movement(mts_id=7, room_id=2, old_room_id=None, date_time=now - timedelta(days=18), person_id=3),
            Movement(mts_id=7, room_id=3, old_room_id=2, date_time=now - timedelta(days=9), person_id=3),
            Movement(mts_id=8, room_id=3, old_room_id=None, date_time=now - timedelta(days=22), person_id=2),
            Movement(mts_id=8, room_id=1, old_room_id=3, date_time=now - timedelta(days=11), person_id=2),
            Movement(mts_id=9, room_id=2, old_room_id=None, date_time=now - timedelta(days=27), person_id=2),
            Movement(mts_id=9, room_id=1, old_room_id=2, date_time=now - timedelta(days=13), person_id=2),
            Movement(mts_id=10, room_id=3, old_room_id=None, date_time=now - timedelta(days=32), person_id=2),
            Movement(mts_id=10, room_id=1, old_room_id=3, date_time=now - timedelta(days=18), person_id=2)
        ]

        db.session.add_all(movements)
        db.session.commit()

    def drop_db():
        db.drop_all()

    def create_all():
        db.create_all()

    # drop_db()
    # create_all()
    # fill_db()

    print(Movement.query.all())
