#!/usr/bin/python

import RPi.GPIO as GPIO
import time
import sys


while True:
    try:
        import socket
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        ## Create an abstract socket, by prefixing it with null.
        s.bind( '\0postconnect_gateway_notify_lock')
	break
    except socket.error as e:
	time.sleep(1)
        error_code = e.args[0]
        error_string = e.args[1]
        print "Process already running (%d:%s ). Exiting" % ( error_code, error_string)

servoPIN = int(sys.argv[1])
servoRange = float(sys.argv[4]) - float(sys.argv[3])
GPIO.setmode(GPIO.BCM)
GPIO.setup(servoPIN, GPIO.OUT)
servoTime = float(sys.argv[5])
pos = (((100-float(sys.argv[2]))/100)*(float(servoRange)))+float(sys.argv[3])
print str(pos)
p = GPIO.PWM(servoPIN, 50) # GPIO 17 for PWM with 50Hz
p.start(float(pos)) # Initialization
time.sleep(servoTime)
p.stop()
GPIO.cleanup()
time.sleep(1)
