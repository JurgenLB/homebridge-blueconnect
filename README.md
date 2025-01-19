
<p align="center">
 <a href="https://github.com/taurgis/homebridge-blueconnect-v2"><img alt="Homebridge iRobot" src="https://github.com/user-attachments/assets/7612a519-e5ad-487c-a815-c22158ee7550" width="600px"></a>
</p>

# homebridge-blueconnect-v2

This is a plugin for BlueRiiot devices. It reads the swimming pool temperature using the BlueConnect account to retrieve it, which the device sends to the BlueRiiot cloud.

## Weather

Since the service also provides weather information for the pool's location, an optional accessory can display the current temperature for weather-based automation.

## Installation

npm install taurgis/homebridge-blueconnect-v2

## Configurations

The configuration parameters need to be added to `platforms` section of the Homebridge configuration file.

```json5
{
    ...
            "platforms": [
                 {
                     "name": "BlueRiiot",
                     "email": "xxxxxx",
                     "password": "xxxxxx",
                     "platform": "BlueRiiot"
                 }
            ]
    ...
}
```


#### Parameters

* `platform` is required, with `BlueRiiot` value.  
* `name` (required) is anything you'd like to use to identify this device. You can always change the name from within the Home app.
* `email` and `password` (required) are your credentials in the BlueConnect app.
