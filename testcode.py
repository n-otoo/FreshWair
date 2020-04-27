#import Adafruit_DHT
import os 
import json
import time
import requests
from sds011 import *
from buffermanager import *
 
# Air Quality Sensor
PMsensor = SDS011("/dev/ttyUSB0")
PMsensor.sleep(sleep=False)
time.sleep(10)
# pm25, pm10 = PMsensor.query()
# print("PM2.5 is :" + str( pm25) + " PM10 :" + str(pm10))

# Set the URL For posting
url = "http://192.168.0.103:8080/scarf/env/pm"

check_for_buffer()
didSucceedInSendingBuffer = True
with open("buffer.txt","r"):
    for line in read_buffer():
       try:
           resp = requests.post(url, data=line)
           print(resp.content)
       except:
           didSucceedInSendingBuffer = False

if didSucceedInSendingBuffer:
    if os.path.exists("buffer.txt"):
        os.remove("buffer.txt")
 
# get a sensor reading (waiting 2 seconds between each retry).
for x in range(5):
  pm25, pm10 = PMsensor.query()
  time.sleep(2)
  data = {"dateTime":int(round(time.time()* 1000)), "pm25":int(pm25), "pm10":int(pm10), "lat":57.194, "lon":-2.118}
  print(str(data) + " " + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
  # the Pi might fail to get a valid reading. So check if readings are valid.
  if pm25 is not None and pm10 is not None:
    try:
        resp = requests.post(url, data=data)
        print(resp.content)
    except Exception as e:
        print(e)
        check_for_buffer()
        write_to_buffer(data)
        try:
            e.raise_for_status()
        except requests.exceptions.HTTPError as error:
            print(error)
    #print(resp.status_code)
  else:
    print('Failed to get reading. Try again!')

