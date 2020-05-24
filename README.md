# homebridge-blinds-servo
homebridge-blinds-servo is a plugin for Homebridge that allows you to open or close your window blinds using a servo connected to a Raspberry Pi.

## Installation
Install homebridge-blinds-servo:

```sh
sudo npm install -g homebridge-blinds-servo
```

## Configuration

Add the accessory in `config.json` in your home directory inside `.homebridge`.

```js
   {
      "accessory": "ServoBlinds",
      "name": "Dining Room Centre Blinds",
      "gpio_pin": 22,
      "servo_min": 4,
      "servo_max": 11,
      "servo_time": 1,
      "intial_position": 100
    }
```
There are also a number of optional configurations you can set.

```js
      "exclusive": true,
      "relayPin": 27,
      "debug": true
```
#### Configuration

| Parameter | Type | Default | Note |
|-----------|------|---------|------|
| `name `	  | String | N/A	| Name of the blind|
| `gpio_pin`| Integer | N/A | Pin that controls the servo (BCM layout) |
| `servo_min` | Float | N/A | The duty cycle to give the 0% position for the blind |
| `servo_max` | Float | N/A | The duty cycle to give the 100% position for the blind |
| `servo_time` | Float | 1 | The time to move the servo |
| `intial_position` | Integer | 0 | The initial position when homebridge initialises<br> Note: the blind will not be moved to this position, it is just what homebridge will see as the position when it initialises. |
| `exclusive` | Boolean | False | Flag if the command script should run sequencial rather than in parallel; this is useful if you don't have enough power to control all of the servos at the same time |
| `relayPin` | Integer | None | If set the script will trigger a relay before moving the servo; this is useful if you are powering the servo via batteries to stop idle draining. |
| `debug` | Boolean | False | Enable the debugging mode which give more output in the homebridge log |
| `moveCmd` | String | `servoDriver.py` | The command to call to move the servo; for more info see below |

#### moveCmd
The plugin calls a script when a request to move the blinds is recieved. By default this script is a built in python script, but this can be modified by the `moveCmd` configuration option to use a custom script. The plugin will call this command in the following format:

`(moveCmd) servoPin pos minLimit maxLimit servoTime [-e] [-r relayPin]`

For example the build in script is called as:

`servoDriver.py servoPin pos minLimit maxLimit servoTime [-e] [-r relayPin]`
## Hardware Setup

I will add a guide to setting up the hardware soon.

## Note
This plugin doesn't query nor have direct knowledge of the actual position of your blinds. Instead, it emulates the position based on your most recent request to raise / lower the blinds (i.e. it remembers what you last asked it to do and reports that back to HomeKit).

This script is based on Robin Temme's excellent homebridge-blinds plugin and hjdhjd's modifications, and I have added to it to allow controlling a servo attached to the blinds.
