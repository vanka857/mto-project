from app import create_app, check_database_connection


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
