from flask_marshmallow import Marshmallow
from .models import (
    Department, Room, Staff, MTS, MTSCategory, Appointment, Movement
)


ma = Marshmallow()


class DepartmentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Department
        include_relationships = True
        include_fk = True

class RoomSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Room
        include_relationships = True
        include_fk = True

class StaffSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Staff
        include_relationships = True
        include_fk = True

class MTSCategorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = MTSCategory
        include_relationships = True
        include_fk = True

class AppointmentSchema(ma.SQLAlchemyAutoSchema):
    owner = ma.Nested(StaffSchema, only=['id', 'surname', 'name_'])  # Указываем поля, которые хотим включить

    class Meta:
        model = Appointment
        include_fk = True

class MovementSchema(ma.SQLAlchemyAutoSchema):
    room = ma.Nested(StaffSchema, only=['id', 'name_'])  # Указываем поля, которые хотим включить

    class Meta:
        model = Movement
        include_fk = True

class MTSSchema(ma.SQLAlchemyAutoSchema):
    movements = ma.Nested(MovementSchema, many=True)
    appointments = ma.Nested(AppointmentSchema, many=True)
    category = ma.Nested(MTSCategorySchema, only=['id', 'name'])  # Укажите поля, которые хотите включить

    class Meta:
        model = MTS
        include_relationships = True
        include_fk = True
