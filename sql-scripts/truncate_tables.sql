-- Удаление данных из таблиц
DELETE FROM mto.movements;
DELETE FROM mto.appointments;
DELETE FROM mto.staff;
DELETE FROM mto.mts;
DELETE FROM mto.rooms;
DELETE FROM mto.departments;

-- Сброс автоинкрементных значений
ALTER SEQUENCE mto.departments_id_seq RESTART WITH 1;
ALTER SEQUENCE mto.mts_id_seq RESTART WITH 1;
ALTER SEQUENCE mto.rooms_id_seq RESTART WITH 1;
ALTER SEQUENCE mto.staff_id_seq RESTART WITH 1;
