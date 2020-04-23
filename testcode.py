import Adafruit_DHT
 
import json
import time
import requests
from sds011 import *

# Set sensor type : Options are DHT11,DHT22 or AM2302
sensor=Adafruit_DHT.DHT11
 
# Set GPIO sensor is connected to
gpio=3

# Air Quality Sensor
PMSensor = SDS011("/dev/ttyUSB0")
sensor.sleep(sleep=true)
time.sleep(10)
pm25, pm10 = sensor.query()
print("PM2.5 is :" + pm25 + " PM10 :" + pm10)

# Set the URL For posting
#url = "http://192.168.43.136:9090/scarf/env/pm"
url = "https://kite.com/fakepagewitherror/error"
# Use read_retry method. This will retry up to 15 times to
# get a sensor reading (waiting 2 seconds between each retry).
for x in range(5):
  humidity, temperature = Adafruit_DHT.read_retry(sensor, gpio)
  data = {"dateTime":10090, "pm25":int(humidity), "pm10":int(temperature), "lat":0, "lon":0}
 
  # Reading the DHT11 is very sensitive to timings and occasionally
  # the Pi might fail to get a valid reading. So check if readings are valid.
  if humidity is not None and temperature is not None:
    try:
        resp = requests.get(url)
    except Exception as e:
        print(e)
        try:
            resp.raise_for_status()
        except requests.exceptions.HTTPError as error:
            print(error)
    #resp = requests.post(url, data = data)
    #print(resp.status_code)
  else:
    print('Failed to get reading. Try again!')

