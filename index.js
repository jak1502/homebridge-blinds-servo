//var request = require("request");
var exec = require("child_process").exec;
var Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-blinds-servo", "ServoBlinds", ServoBlindsAccessory);
}

function ServoBlindsAccessory(log, config) {
    // global vars
    this.log = log;
    this.cmdArgs = [];

    // serial and manufacturer info
    this.serial = config["serial"] || "Default-SerialNumber";
    this.model = config["model"] || "Default-Model";
    this.manufacturer = config["manufacturer"] || "Default-Manufacturer";

    // configuration vars
    this.name = config["name"];
    this.servoMAX = config["servo_max"];
    this.servoMIN = config["servo_min"];
    this.gpioPIN = config["gpio_pin"];
    this.moveCmd = config["move_cmd"] || (__dirname + "/" + "servoDriver.py");
    this.servoTime = config["servo_time"] || "1";
    this.initialPos = config["initial_position"] || 0;
    this.exclusive = config["exclusive"] || 0;
    this.relayPin = config["relay_pin"] || 0;
    this.ServoBlindsDebug = config["debug"] || 0;

    // set cmd arguments
    if (this.exclusive) {
      this.cmdArgs.push('-e');
      if (this.ServoBlindsDebug) this.log("Exclusive set, cmdArgs: %s", this.cmdArgs.join(' '));
    }

    if (this.relayPin) {
      this.cmdArgs.push('-r');
      this.cmdArgs.push(this.relayPin);
      if (this.ServoBlindsDebug) this.log("Relay Pin set, cmdArgs: %s", this.cmdArgs.join(' '));
    }

    // state vars
    this.lastPosition = this.initialPos; // last known position of the blinds, down by default
    this.currentPositionState = Characteristic.PositionState.STOPPED; // stopped by default
    this.currentTargetPosition = this.initialPos; // down by default

    // register the service and provide the functions
    this.service = new Service.WindowCovering(this.name);

    // initialize the current window state.
   this.service
       .setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);

    // the current position (0-100%)
    this.service
        .getCharacteristic(Characteristic.CurrentPosition)
        .on('get', this.getCurrentPosition.bind(this));

    // the position state
    // 0 = DECREASING; 1 = INCREASING; 2 = STOPPED;
    this.service
        .getCharacteristic(Characteristic.PositionState)
        .on('get', this.getPositionState.bind(this));

    // the target position (0-100%)
    this.service
        .getCharacteristic(Characteristic.TargetPosition)
        .on('get', this.getTargetPosition.bind(this))
        .on('set', this.setTargetPosition.bind(this));

}

ServoBlindsAccessory.prototype.getCurrentPosition = function(callback) {
    this.lastState(function(error, lPos) {
      if (error) {
        this.log('Unable to retrieve current position');
        callback(error);
      } else {
        if (this.ServoBlindsDebug) this.log("Requested CurrentPosition: %s", lPos);
        callback(null, lPos);
      }
    }.bind(this));
}

ServoBlindsAccessory.prototype.getPositionState = function(callback) {
    if (this.ServoBlindsDebug) this.log("Requested PositionState: %s", this.currentPositionState);
    callback(null, this.currentPositionState);
}

ServoBlindsAccessory.prototype.getTargetPosition = function(callback) {
    if (this.ServoBlindsDebug) this.log("Requested TargetPosition: %s", this.currentTargetPosition);
    callback(null, this.currentTargetPosition);
}

ServoBlindsAccessory.prototype.setTargetPosition = function(pos, callback) {
    if (this.ServoBlindsDebug) this.log("Set TargetPosition: %s", pos);
    this.currentTargetPosition = pos;

    this.lastState(function(error, lPos) {
      if (error) {
        this.log('Unable to query current position');
        callback(error);
      } else {
        const moveUp = ((this.currentTargetPosition != 0) && (this.currentTargetPosition >= lPos));
        this.log((moveUp ? "Moving up" : "Moving down"));

        this.cmdRequest(moveUp, this.moveCmd, pos, function(error, stdout, stderr) {
          if (error) {
    	    this.log('Move function failed: %s', stderr);
	    callback(error);
          } else {
      	    this.log("Success moving to %s", pos)

	    this.lastPosition = pos;

	    // set our current position and set our position to stopped.
            this.service
                .setCharacteristic(Characteristic.CurrentPosition, this.lastPosition);
            this.currentPositionState = Characteristic.PositionState.STOPPED;
            this.service
                .setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);

	    if (this.ServoBlindsDebug) this.log('Move function succeeded.');
	    callback(null);
      if (this.ServoBlindsDebug) {
        this.stdoutput = stdout.split(/\r?\n/);
        this.stdoutput.forEach(element => {
          this.log('Script Output: ' + element);
        });
       
          }
          }
	    // just in case.
            this.currentPositionState = Characteristic.PositionState.STOPPED;
            this.service
                .setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
        }.bind(this));
      }
    }.bind(this));
}

ServoBlindsAccessory.prototype.lastState = function(callback) {
  callback(null, this.lastPosition);
}

ServoBlindsAccessory.prototype.cmdRequest = function(moveUp, cmd, pos, callback) {
  this.currentPositionState = (moveUp ? Characteristic.PositionState.INCREASING : Characteristic.PositionState.DECREASING);
  this.service
    .setCharacteristic(Characteristic.PositionState, (moveUp ? Characteristic.PositionState.INCREASING : Characteristic.PositionState.DECREASING));
  if (this.ServoBlindsDebug) this.log('Calling command: ' + cmd + ' ' + this.gpioPIN + ' ' + pos + ' ' + this.servoMIN + ' ' + this.servoMAX + ' ' + this.servoTime + ' ' + this.cmdArgs.join(' '));
  exec(cmd + ' ' + this.gpioPIN + ' ' + pos + ' ' + this.servoMIN + ' ' + this.servoMAX + ' ' + this.servoTime + ' ' + this.cmdArgs.join(' '), function(error, stdout, stderr) {
    callback(error, stdout, stderr)
  });
}

ServoBlindsAccessory.prototype.getServices = function() {
  var informationService = new Service.AccessoryInformation();

  informationService
    .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
    .setCharacteristic(Characteristic.Model, this.model)
    .setCharacteristic(Characteristic.SerialNumber, this.serial);

  return [this.service, informationService];
}
