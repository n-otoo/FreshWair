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
            # print("Lat :" + sentance.lat + " | Lon:" + sentance.lon + "" + sentance.lon_dir)
            return convertToDegrees(sentance.lat, sentance.lat_dir, sentance.lon, sentance.lon_dir)

def get_location():
    reading = True

    while reading:
        response = getGLLSentance()
        if response != None:
            reading = False
            return response

def convertToDegrees(lat, latdir, lon, londir):
    #Sort out the directions of the based on N/S and E/W bearing
    lonDirection = 1
    latDirection = 1
    if latdir == 'S':
        latDirection = -1
    if londir == 'W':
        lonDirection = -1

    # lon format is dddmm.mmmm
    lonDegrees = float(lon[:3])
    lonMinutes = float(lon[3:5])
    lonMinuteFraction = float(lon[-5:]) / 100000
    lonInDec = lonDegrees  + ((lonMinutes + lonMinuteFraction) / 60)

    # lat format is  ddmm.mmm
    latDegrees = float(lat[:2])
    latMinutes = float(lat[2:4])
    latMinuteFraction = float(lat[-5:]) / 100000
    latInDec = latDegrees + ((latMinutes + latMinuteFraction) / 60)

    latlon = {"lat":latInDec * latDirection, "lon":lonInDec * lonDirection}
    return latlon

