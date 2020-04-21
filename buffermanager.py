import os
import os.path
import json 

#   This function will check if the buffer file exists, and if it does not,
#   creates it.
def check_for_buffer():
	if not os.path.isfile('buffer'):
		with open("buffer.txt","w") as buffer:
			buffer.write("")

#   This function will red all the lines in the file, and return them as an
#   array of JSON  dictionaries
def read_buffer():
	bufferAsJSON = []

	with open("buffer.txt", "r") as buffer:
		for line in buffer:
			object = json.loads(line)
			bufferAsJSON.append(object)

	return bufferAsJSON

def write_to_buffer(failedrequest):
	with open("buffer.txt", "w") as buffer:
		requestAsJSONString = json.dumps(failedrequest)
		buffer.write(requestAsJSONString)
