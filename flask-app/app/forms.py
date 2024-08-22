from flask_wtf import FlaskForm
from wtforms import SelectField, StringField, SubmitField

class SearchForm(FlaskForm):
    responsible = SelectField('Ответственный', choices=[], default='-')
    location = SelectField('Помещение', choices=[], default='-')
    category = SelectField('Категория', choices=[], default='-')
    name_or_inventory_number = StringField('Название или инвентарный номер')
    submit = SubmitField('Поиск')
