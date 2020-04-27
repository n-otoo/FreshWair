import serial
import pynmea2

def getGLLSentance():
    GPSport = "/dev/ttyACM0"
    
    # Create a sensor object reading from the serial port
    GPSsensor = serial.Serial(GPSport, timeout=0.5)
    # Get a message from the sensor, and return the GLL (gloobal locacation NMEA sentence) object
    while True:
        message = GPSsensor.readline()
        if message.find(b'GLL') > 0:
            sentance = pynmea2.parse(message.decode("utf-8"))
         #   print("Lat :" + str((float(sentance.lat) / 100)) + " | Lon:" + str((float(sentance.lon) / 100)) + "" + sentance.lon_dir)
            direction = 1
            if sentance.lon_dir == 'W':
                direction = -1
            return {"lat": float(sentance.lat)/100,"lon":(float(sentance.lon)/100) * direction}

def get_location():
    reading = True

    while reading:
        response = getGLLSentance()
        if response != None:
            reading = False
            return response

print(get_location())
