from . import db


class Department(db.Model):
    __tablename__ = 'departments'
    __table_args__ = {'schema': 'mto'}
    id = db.Column(db.Integer, primary_key=True)
    name_ = db.Column(db.String(200))
    parent_id = db.Column(db.Integer, db.ForeignKey('mto.departments.id'))
    children = db.relationship('Department', backref=db.backref('parent', remote_side=[id]))

class Room(db.Model):
    __tablename__ = 'rooms'
    __table_args__ = {'schema': 'mto'}
    id = db.Column(db.Integer, primary_key=True)
    name_ = db.Column(db.String(500))
    purpose = db.Column(db.String(500))
    address = db.Column(db.String(500))

class Staff(db.Model):
    __tablename__ = 'staff'
    __table_args__ = {'schema': 'mto'}
    id = db.Column(db.Integer, primary_key=True)
    surname = db.Column(db.String(50))
    name_ = db.Column(db.String(50))
    patronymic = db.Column(db.String(50))
    position = db.Column(db.String(500))
    rank = db.Column(db.String(50))
    department_id = db.Column(db.Integer, db.ForeignKey('mto.departments.id'))

class MTS(db.Model):
    __tablename__ = 'mts'
    __table_args__ = {'schema': 'mto'}
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(255))
    inventory_number = db.Column(db.String(30))
    unit_of_measure = db.Column(db.String(255))
    volume = db.Column(db.Float)
    price = db.Column(db.Float)
    end_of_life = db.Column(db.DateTime)
    registration_date = db.Column(db.Date)
    revaluation_date = db.Column(db.Date)
    written_off = db.Column(db.Boolean, default=False)
    write_off_date = db.Column(db.Date)
    registration_doc_no = db.Column(db.String(255))
    revaluation_doc_no = db.Column(db.String(255))
    write_off_doc_no = db.Column(db.String(255))

class Appointment(db.Model):
    __tablename__ = 'appointments'
    __table_args__ = {'schema': 'mto'}
    id = db.Column(db.Integer, primary_key=True)
    mts_id = db.Column(db.Integer, db.ForeignKey('mto.mts.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('mto.staff.id'), nullable=False)
    old_owner_id = db.Column(db.Integer, db.ForeignKey('mto.staff.id'))
    date_time = db.Column(db.DateTime)
    reason = db.Column(db.String(500))

class Movement(db.Model):
    __tablename__ = 'movements'
    __table_args__ = {'schema': 'mto'}
    id = db.Column(db.Integer, primary_key=True)
    mts_id = db.Column(db.Integer, db.ForeignKey('mto.mts.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('mto.rooms.id'), nullable=False)
    old_room_id = db.Column(db.Integer, db.ForeignKey('mto.rooms.id'))
    date_time = db.Column(db.DateTime)
    person_id = db.Column(db.Integer, db.ForeignKey('mto.staff.id'))
