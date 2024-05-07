DO
$$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mto' AND table_name = 'appointments') THEN
        DROP TABLE mto.appointments;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mto' AND table_name = 'movements') THEN
        DROP TABLE mto.movements;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mto' AND table_name = 'mts') THEN
        DROP TABLE mto.mts;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mto' AND table_name = 'staff') THEN
        DROP TABLE mto.staff;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mto' AND table_name = 'departments') THEN
        DROP TABLE mto.departments;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mto' AND table_name = 'rooms') THEN
        DROP TABLE mto.rooms;
    END IF;
END
$$;
