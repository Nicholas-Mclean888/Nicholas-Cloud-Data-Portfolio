
import pyodbc

# SQL Server connection settings
server = r"COMPUTER_1\SQLEXPRESS02"
database = "MelbourneWeatherDB"
driver = "ODBC Driver 18 for SQL Server"

try:
    # Connect using Windows Authentication
    connection = pyodbc.connect(
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        "Trusted_Connection=yes;"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;",
        timeout=10
    )

    print("Successfully connected to SQL Server!")

    # Check which database we are connected to
    cursor = connection.cursor()
    cursor.execute("SELECT DB_NAME()")
    result = cursor.fetchone()

    print(f"Connected database: {result[0]}")

    cursor.close()
    connection.close()

except pyodbc.Error as error:
    print(f"SQL Server connection failed: {error}")
