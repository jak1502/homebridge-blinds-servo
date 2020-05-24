#!/usr/bin/python

###############################################################################
## servoDriver
###############################################################################
# usage: servoDriver.py [-h] [-v] [-e] [-r [relayPin]]
#                       servoPin pos minLimit maxLimit servoTime
#
# servoDriver is used to control a servo connected to the GPIO of a RaspberryPi.
# It takes a number of inputs and should be called form the command line.
#
# positional arguments:
#   servoPin              the GPIO pin for servo control
#   pos                   the requested position of the servo
#   minLimit              the duty cycle to give the 0% position
#   maxLimit              the duty cycle to give the 100% position
#   servoTime             the time to move the servo in seconds
#
# optional arguments:
#   -h, --help            show this help message and exit
#   -v, --version         show program's version number and exit
#   -e, --exclusive       only control one servo at a time
#   -r [relayPin], --relayPin [relayPin]
#                         trigger relay before controlling servo
###############################################################################

scriptVersion='2.0'

import RPi.GPIO as GPIO
import time
import sys
import argparse
import socket

# Define fuctions for type checkers

# Check servoPin is valid
def pin_type(x):
    try:
        x = int(x)
    except ValueError:
        raise argparse.ArgumentTypeError("Must be an integer")
    if x > 27 or x <0:
        raise argparse.ArgumentTypeError("Must be in the range 0-27")
    return x

# Check pos is valid
def pos_type(x):
    try:
        x = int(x)
    except ValueError:
        raise argparse.ArgumentTypeError("Must be an integer")
    if x > 100 or x <0:
        raise argparse.ArgumentTypeError("Must be in the range 0-100")
    return x

# Check minLimit and maxLimit are valid
def limit_type(x):
    x = float(x)
    if x < 0 or x > 14:
        raise argparse.ArgumentTypeError("Must be in the range 0-14")
    return x

# Setup input parser
parser = argparse.ArgumentParser(description='servoDriver is used to control a servo connected to the '
    'GPIO of a RaspberryPi. It takes a number of inputs and should be called form the command line.', version=scriptVersion)
parser.add_argument('servoPin', metavar='servoPin', type=pin_type, help='the GPIO pin for servo control')
parser.add_argument('pos', metavar='pos', type=pos_type, help='the requested position of the servo')
parser.add_argument('minLimit', metavar='minLimit', type=limit_type, help='the duty cycle to give the 0%% position')
parser.add_argument('maxLimit', metavar='maxLimit', type=limit_type, help='the duty cycle to give the 100%% position')
parser.add_argument('servoTime', metavar='servoTime', type=float, help='the time to move the servo')
parser.add_argument('-e', '--exclusive', action='store_true', help='only control one servo at a time')
parser.add_argument('-r', '--relayPin', metavar='relayPin', nargs='?', const=1, type=pin_type, help='trigger relay before controlling servo')

args = parser.parse_args()
# Check if minLimit and maxLimit are valid
if args.minLimit > args.maxLimit:
    parser.error("minLimit must be less than maxLimit")

# If running exclusive mode then check if process is running on another pin and wait for that to complete if it is
if args.exclusive is True:
    print('Running in exclusive mode')
    while True:
        try:
            s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            # Create an abstract socket, by prefixing it with null.
            s.bind( '\0postconnect_gateway_notify_lock')
            break
        except socket.error as e:
            # Another instance is already running, wait and try again after 1 second
            time.sleep(1)
            error_code = e.args[0]
            error_string = e.args[1]

# Set full range of servo
servoRange = float(args.maxLimit) - float(args.minLimit)
# Setup GPIO pin
GPIO.setmode(GPIO.BCM)
GPIO.setup(args.servoPin, GPIO.OUT)
p = GPIO.PWM(args.servoPin, 50)
# Calculate required position
pos = (((100-float(args.pos))/100)*(float(servoRange)))+float(args.minLimit)
# Trigger relay if set
if args.relayPin is not None:
    # Setup relay pin
    GPIO.setup(args.relayPin, GPIO.OUT)
    # Turn on relay
    GPIO.output(args.relayPin, GPIO.LOW)
# Set servo position
p.start(float(pos))
print('Moving servo')
# Sleep for required time
time.sleep(float(args.servoTime))
# Stop servo
p.stop()
print('Stopping servo')
# Trigger relay if set
if args.relayPin is not None:
    # Turn off relay
    GPIO.output(args.relayPin, GPIO.HIGH)
# Cleanup
GPIO.cleanup()
# Pause to allow proper clean up
time.sleep(0.5)
print('Complete')