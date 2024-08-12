CREATE SCHEMA IF NOT EXISTS mto;

CREATE TABLE IF NOT EXISTS mto.departments
(
  id        SERIAL PRIMARY KEY,
  name_     VARCHAR(200), -- Name of the department
  parent_id INTEGER,      -- Reference to parent department, if any
  CONSTRAINT FK_parent_departments FOREIGN KEY (parent_id) REFERENCES mto.departments(id)
);

CREATE TABLE IF NOT EXISTS mto.rooms
(
  id       SERIAL PRIMARY KEY,
  name_    VARCHAR(500),  -- Room name or designation
  purpose  VARCHAR(500),  -- Purpose of the room
  address_ VARCHAR(500)   -- Physical address of the room
);

CREATE TABLE IF NOT EXISTS mto.staff
(
  id            SERIAL PRIMARY KEY,
  surname       VARCHAR(50),  -- Surname of the staff member
  name_         VARCHAR(50),  -- First name of the staff member
  patronymic    VARCHAR(50),  -- Patronymic of the staff member
  position      VARCHAR(500), -- Job position of the staff member
  rank          VARCHAR(50),  -- Rank of the staff member
  department_id INTEGER NOT NULL, -- Reference to the department of the staff member
  CONSTRAINT FK_department_staff FOREIGN KEY (department_id) REFERENCES mto.departments(id)
);

CREATE TABLE IF NOT EXISTS mto.mts
(
  id                    SERIAL PRIMARY KEY,
  item_name             VARCHAR(1000) NOT NULL, -- Name of the item or type
  inventory_number      VARCHAR(30),           -- Inventory number of the item
  unit_of_measure       VARCHAR(30) NOT NULL, -- Unit of measure for the item
  volume                FLOAT,                 -- Volume or quantity of the item
  price                 FLOAT,                 -- Price of the item
  end_of_life           TIMESTAMP,             -- Date when the item is expected to be unusable
  registration_date     DATE,                  -- Date of item registration
  revaluation_date      DATE,                  -- Date of item revaluation
  written_off           BOOLEAN DEFAULT FALSE,
  write_off_date        DATE,                  -- Date of item write-off
  registration_doc_no   VARCHAR(30),          -- Document number for registration
  revaluation_doc_no    VARCHAR(30),          -- Document number for revaluation
  write_off_doc_no      VARCHAR(30)           -- Document number for write-off
);

CREATE TABLE IF NOT EXISTS mto.appointments
(
  mts_id       INTEGER  NOT NULL,
  owner_id     INTEGER  NOT NULL,
  old_owner_id INTEGER,
  date_time    TIMESTAMP,
  reason       VARCHAR(500),
  CONSTRAINT FK_mts_TO_appointments FOREIGN KEY (mts_id) REFERENCES mto.mts(id),
  CONSTRAINT FK_staff_TO_appointments FOREIGN KEY (owner_id) REFERENCES mto.staff(id),
  CONSTRAINT FK_staff_TO_appointments1 FOREIGN KEY (old_owner_id) REFERENCES mto.staff(id)
);

CREATE TABLE IF NOT EXISTS mto.movements
(
  mts_id      INTEGER NOT NULL,
  room_id     INTEGER NOT NULL,
  old_room_id INTEGER,
  date_time   TIMESTAMP NULL,
  person_id   INTEGER,
  CONSTRAINT FK_mts_TO_movements FOREIGN KEY (mts_id) REFERENCES mto.mts(id),
  CONSTRAINT FK_room_TO_movements FOREIGN KEY (room_id) REFERENCES mto.rooms(id),
  CONSTRAINT FK_room_TO_movements1 FOREIGN KEY (old_room_id) REFERENCES mto.rooms(id),
  CONSTRAINT FK_staff_TO_movements FOREIGN KEY (person_id) REFERENCES mto.staff(id)
);
