import requests
import datetime
import pandas as pd
import time
import pyodbc
import os

# OpenWeatherMap API configuration
API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Melbourne coordinates
LATITUDE = -37.8136
LONGITUDE = 144.9631

# API endpoint
API_URL = "https://api.openweathermap.org/data/2.5/weather"

# API request parameters
API_PARAMS = {
    "lat": LATITUDE,
    "lon": LONGITUDE,
    "units": "metric",
    "appid": API_KEY
}

# SQL Server database configuration
SQL_SERVER = r"COMPUTER_1\SQLEXPRESS02"
SQL_DATABASE = "MelbourneWeatherDB"
SQL_DRIVER = "ODBC Driver 18 for SQL Server"


# CSV output configuration
CSV_FILENAME = "melbourne_weather_data.csv"


# Function to connect to SQL Server
def connect_to_sql():
    connection = pyodbc.connect(
        f"DRIVER={{{SQL_DRIVER}}};"
        f"SERVER={SQL_SERVER};"
        f"DATABASE={SQL_DATABASE};"
        "Trusted_Connection=yes;"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;",
        timeout=10
    )

    return connection

# Save a weather observation to SQL Server
def save_weather_to_sql(record):
    connection = connect_to_sql()

    try:
        cursor = connection.cursor()

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
            record["Timestamp"],
            record["Temperature_Celsius"],
            record["Humidity_Percent"],
            record["Sea_Level_hPa"],
            record["Ground_Level_hPa"],
            record["Wind_Speed_mps"],
            record["Wind_Deg"],
            record["Wind_Gust_mps"]
        )

        cursor.execute(sql, values)
        connection.commit()

        print("Weather observation saved to SQL Server!")

    finally:
        connection.close()

# Save a weather observation to CSV
def save_weather_to_csv(record):
    file_exists = os.path.isfile(CSV_FILENAME)

    dataframe = pd.DataFrame([record])

    dataframe.to_csv(
        CSV_FILENAME,
        mode="a",
        header=not file_exists,
        index=False
    )

    print("Weather observation saved to CSV!")



# Get live weather data from OpenWeatherMap
def collect_live_weather():
    response = requests.get(
        API_URL,
        params=API_PARAMS,
        timeout=10
    )

    response.raise_for_status()
    data = response.json()

    print("Successfully retrieved live weather data!")
    print(f"City: {data['name']}")
    print(f"Temperature: {data['main']['temp']}°C")
    print(f"Humidity: {data['main']['humidity']}%")


    # Convert live API data into a weather record
    weather_record = {
        "Timestamp": datetime.datetime.now(),
        "Temperature_Celsius": data["main"]["temp"],
        "Humidity_Percent": data["main"]["humidity"],
        "Sea_Level_hPa": data["main"].get("sea_level"),
        "Ground_Level_hPa": data["main"].get("grnd_level"),
        "Wind_Speed_mps": data.get("wind", {}).get("speed"),
        "Wind_Deg": data.get("wind", {}).get("deg"),
        "Wind_Gust_mps": data.get("wind", {}).get("gust")
    }
    save_weather_to_sql(weather_record)
    save_weather_to_csv(weather_record)
    
# Collect weather observations every five minutes
COLLECTION_INTERVAL_SECONDS = 300
# Continuously collect Melbourne weather observations
def collect_weather_automatically():
    print("Starting continuous weather collection...")
    print("Press Ctrl + C to stop.")

    try:
        while True:
            try:
                collect_live_weather()
                print("Waiting 5 minutes for next observation...")

            except Exception as error:
                print(f"Weather collection failed: {error}")

            time.sleep(COLLECTION_INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print("\nWeather collection stopped by user.")


if __name__ == "__main__":
    collect_weather_automatically()