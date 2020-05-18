#!/usr/bin/env python3

import os 
import json
import time
import requests
from sds011 import *
from buffermanager import *
from gpsmanager import *
 
# Air Quality Sensor
PMsensor = SDS011("/dev/ttyUSB0")
PMsensor.sleep(sleep=False)
time.sleep(10)
# pm25, pm10 = PMsensor.query()
# print("PM2.5 is :" + str( pm25) + " PM10 :" + str(pm10))

# Set the URL For posting
url = "https://freshwair.hopto.org:8443/scarf/env/pm"

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
for x in range(3):
  pm25, pm10 = PMsensor.query()
  location = get_location()
  time.sleep(2)
  data = {"dateTime":int(round(time.time()* 1000)), "pm25":int(pm25), "pm10":int(pm10), "lat":location["lat"], "lon":location["lon"]}
  print(str(data) + " " + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
  # the Pi might fail to get a valid reading. So check if readings are valid.
  if pm25 is not None and pm10 is not None:
    try:
        resp = requests.post(url, data=data, verify=False)
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

