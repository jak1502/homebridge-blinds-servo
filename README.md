# homebridge-servo-blinds

`homebridge-servo-blinds` is a plugin for Homebridge that allows you to open or close your window blinds using a servo connected to a Raspberry Pi.

## Installation

If you are new to Homebridge, please first read the Homebridge [documentation](https://www.npmjs.com/package/homebridge).
If you are running on a Raspberry, you will find a tutorial in the [homebridge-punt Wiki](https://github.com/cflurin/homebridge-punt/wiki/Running-Homebridge-on-a-Raspberry-Pi).

Install homebridge:
```sh
sudo npm install -g homebridge
```
Install homebridge-servo-blinds:
```sh
sudo npm install -g homebridge-servo-blinds
```

## Configuration

Add the accessory in `config.json` in your home directory inside `.homebridge`.

```js
   {
      "accessory": "BlindsCMD",
      "name": "Dining Room Centre Blinds",
      "gpio_pin": 22,
      "servo_min": 4,
      "servo_max": 11,
      "servo_time": 1,
      "intial_position": 100
    }
```

## Note
This plugin doesn't query nor have direct knowledge of the actual position of your blinds. Instead, it emulates the position based on your most recent request to raise / lower the blinds (i.e. it remembers what you last asked it to do and reports that back to HomeKit). Some blinds, such as Somfy, don't support querying their specific state.

This script is based on Robin Temme's excellent homebridge-blinds plugin and hjdhjd's modifications, and I have added to it to allow controlling a servo attached to the blinds.
