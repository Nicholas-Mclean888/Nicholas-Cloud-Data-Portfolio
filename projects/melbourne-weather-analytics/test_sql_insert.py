
import pyodbc
from datetime import datetime

# SQL Server connection settings
server = r"COMPUTER_1\SQLEXPRESS02"
database = "MelbourneWeatherDB"
driver = "ODBC Driver 18 for SQL Server"

# Sample weather observation
timestamp = datetime.now()
temperature = 22.50
humidity = 65
sea_level = 1013.25
ground_level = 1009.80
wind_speed = 4.20
wind_deg = 180
wind_gust = 6.50

connection = None

try:
    # Connect to SQL Server
    connection = pyodbc.connect(
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        "Trusted_Connection=yes;"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;",
        timeout=10
    )

    cursor = connection.cursor()

    # Insert the sample weather observation
    sql = """
    INSERT INTO dbo.WeatherObservations (
        [Timestamp],
        Temperature_Celsius,
        Humidity_Percent,
        Sea_Level_hpa,
        Ground_Level_hpa,
        Wind_Speed_mps,
        Wind_Deg,
        Wind_Gust_mps
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """

    values = (
        timestamp,
        temperature,
        humidity,
        sea_level,
        ground_level,
        wind_speed,
        wind_deg,
        wind_gust
    )

    cursor.execute(sql, values)
    connection.commit()

    print("Weather observation inserted successfully!")

except pyodbc.Error as error:
    print(f"SQL insert failed: {error}")

finally:
    if connection is not None:
        connection.close()
