from flask_wtf import FlaskForm
from wtforms import SelectField, StringField, SubmitField, HiddenField


class SearchForm(FlaskForm):
    responsible = SelectField('Ответственный', choices=[], default='-')
    location = SelectField('Помещение', choices=[], default='-')
    category = SelectField('Категория', choices=[], default='-')
    name_or_inventory_number = StringField('Название или инвентарный номер')
    submit = SubmitField('Поиск')


class RoomEditForm(FlaskForm):
    mts_id = HiddenField()  # Добавляем скрытое поле для хранения mts_id
    new_room = SelectField('Новое помещение', choices=[])
    responsible_for_moving = SelectField('Ответственный за перемещение', choices=[], default='-')
    submit_btn = SubmitField('Редактировать помещение')


class OwnerEditForm(FlaskForm):
    mts_id = HiddenField()  # Добавляем скрытое поле для хранения mts_id
    new_owner = SelectField('Новый ответственный', choices=[])
    reason = StringField('Причина смены ответственного')
    submit_btn = SubmitField('Редактировать ответственного')
