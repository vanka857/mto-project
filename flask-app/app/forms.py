from flask_wtf import FlaskForm
from wtforms import SelectField, StringField, SubmitField

class SearchForm(FlaskForm):
    responsible = SelectField('Ответственный', choices=[], default='Иванов')
    location = SelectField('Помещение', choices=[], default='Столовая')
    name_or_inventory_number = StringField('Название или инв. номер')
    submit = SubmitField('Поиск')
