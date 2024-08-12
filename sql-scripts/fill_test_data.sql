-- Вставка тестовых данных в таблицу mto.departments
INSERT INTO mto.departments (name_)
VALUES
    ('ВУЦ МФТИ');
INSERT INTO mto.departments (name_, parent_id)
VALUES
    ('Отдел №1', 1),
    ('Отдел №2', 1);

-- Вставка тестовых данных в таблицу mto.rooms
INSERT INTO mto.rooms (name_, purpose, address_)
VALUES
    ('Кабинет 101', 'Конференц-зал', 'ул. Ленина, д. 123'),
    ('Кабинет 102', 'Офис', 'пр. Победы, д. 456'),
    ('Кабинет 103', 'Склад', 'ул. Советская, д. 789'),
    ('Кабинет 104', 'Лаборатория', 'пр. Пушкина, д. 321'),
    ('Кабинет 105', 'Переговорная', 'ул. Гагарина, д. 654');

-- Вставка тестовых данных в таблицу mto.staff
INSERT INTO mto.staff (surname, name_, patronymic, position, rank, department_id)
VALUES
    ('Иванов', 'Иван', 'Иванович', 'Начальник ВУЦ', 'Полковник', 1),
    ('Петров', 'Петр', 'Петрович', 'Начальник цикла военной подготовки', 'Полковник', 1),
    ('Сидоров', 'Сидор', 'Сидорович', 'Преподаватель', 'Подполковник', 1),
    ('Кузнецова', 'Елена', 'Александровна', 'Преподаватель', 'Майор', 1);
INSERT INTO mto.staff (surname, name_, patronymic, position, department_id)
VALUES
    ('Смирнов', 'Михаил', 'Сергеевич', 'Техник', 3);

INSERT INTO mto.mts (item_name, inventory_number, unit_of_measure, price, registration_date, registration_doc_no) 
VALUES
    ('Брошюровщик Renz SRW 360, без орг., 25л./120л.мет.пруж', '41013417818', 'шт.', 54950, '2022-03-27', '0000-000525'),
    ('Тележка гидравлическая MEWA MW 20, 2000кг, 1150x550', '410136188249', 'шт.', 18000, '2022-03-27', '0000-000525'),
    ('Уничтожитель документов HSM Securio AF150 4.5x30,4 ур.секр., 12лист, 34л', '410134178539', 'шт.', 49990, '2022-03-27', '0000-000525'),
    ('Уничтожитель документов HSM Securio AF150 4.5x30,4 ур.секр., 12лист, 34л', '410134178540', 'шт.', 49990, '2022-03-27', '0000-000525'),
    ('Уничтожитель документов HSM Securio AF150 4.5x30,4 ур.секр., 12лист, 34л', '410134178620', 'шт.', 49990, '2022-03-27', '0000-000525'),
    ('Лампа оригинальная смодулем', '410136200788', 'шт.', 12017, '2022-03-27', '0000-000525'),
    -- Добавление 5 дополнительных записей
    ('Принтер офисный HP LaserJet Pro', '410200001001', 'шт.', 20500, '2022-03-27', '0000-000525'),
    ('Кофемашина DeLonghi Magnifica S', '410200001002', 'шт.', 45500, '2022-03-27', '0000-000525'),
    ('Сканер документов Canon ScanJet', '410200001003', 'шт.', 8900, '2022-03-27', '0000-000525'),
    ('Монитор Dell UltraSharp 27"', '410200001004', 'шт.', 37000, '2022-03-27', '0000-000525'),
    ('Клавиатура механическая Logitech G915', '410200001005', 'шт.', 12990, '2022-03-27', '0000-000525');

INSERT INTO mto.appointments (mts_id, owner_id, old_owner_id, date_time, reason)
VALUES 
    (1, 1, NULL, NOW() - INTERVAL '10 days', 'Initial assignment'),
    (1, 2, 1, NOW() - INTERVAL '5 days', 'Reassigned due to role change'),
    (2, 2, NULL, NOW() - INTERVAL '15 days', 'Initial assignment'),
    (2, 1, 2, NOW() - INTERVAL '8 days', 'Reassigned to new project'),
    (3, 2, NULL, NOW() - INTERVAL '20 days', 'Initial assignment'),
    (3, 1, 2, NOW() - INTERVAL '12 days', 'Reassigned due to relocation'),
    (4, 1, NULL, NOW() - INTERVAL '25 days', 'Initial assignment'),
    (4, 3, 1, NOW() - INTERVAL '10 days', 'Reassigned to new department'),
    (5, 3, NULL, NOW() - INTERVAL '30 days', 'Initial assignment'),
    (5, 2, 3, NOW() - INTERVAL '15 days', 'Reassigned to new role'),
    (6, 1, NULL, NOW() - INTERVAL '10 days', 'Initial assignment'),
    (6, 2, 1, NOW() - INTERVAL '5 days', 'Reassigned due to role change'),
    (7, 2, NULL, NOW() - INTERVAL '15 days', 'Initial assignment'),
    (7, 1, 2, NOW() - INTERVAL '8 days', 'Reassigned to new project'),
    (8, 2, NULL, NOW() - INTERVAL '20 days', 'Initial assignment'),
    (8, 1, 2, NOW() - INTERVAL '12 days', 'Reassigned due to relocation'),
    (9, 1, NULL, NOW() - INTERVAL '25 days', 'Initial assignment'),
    (9, 3, 1, NOW() - INTERVAL '10 days', 'Reassigned to new department'),
    (10, 3, NULL, NOW() - INTERVAL '30 days', 'Initial assignment'),
    (10, 2, 3, NOW() - INTERVAL '15 days', 'Reassigned to new role');

INSERT INTO mto.movements (mts_id, room_id, old_room_id, date_time, person_id)
VALUES 
    (1, 1, NULL, NOW() - INTERVAL '12 days', 1),
    (1, 2, 1, NOW() - INTERVAL '6 days', 1),
    (2, 2, NULL, NOW() - INTERVAL '18 days', 3),
    (2, 3, 2, NOW() - INTERVAL '9 days', 3),
    (3, 3, NULL, NOW() - INTERVAL '22 days', 2),
    (3, 1, 3, NOW() - INTERVAL '11 days', 2),
    (4, 2, NULL, NOW() - INTERVAL '27 days', 2),
    (4, 1, 2, NOW() - INTERVAL '13 days', 2),
    (5, 3, NULL, NOW() - INTERVAL '32 days', 2),
    (5, 1, 3, NOW() - INTERVAL '18 days', 2),
    (6, 1, NULL, NOW() - INTERVAL '12 days', 1),
    (6, 2, 1, NOW() - INTERVAL '6 days', 1),
    (7, 2, NULL, NOW() - INTERVAL '18 days', 3),
    (7, 3, 2, NOW() - INTERVAL '9 days', 3),
    (8, 3, NULL, NOW() - INTERVAL '22 days', 2),
    (8, 1, 3, NOW() - INTERVAL '11 days', 2),
    (9, 2, NULL, NOW() - INTERVAL '27 days', 2),
    (9, 1, 2, NOW() - INTERVAL '13 days', 2),
    (10, 3, NULL, NOW() - INTERVAL '32 days', 2),
    (10, 1, 3, NOW() - INTERVAL '18 days', 2);
