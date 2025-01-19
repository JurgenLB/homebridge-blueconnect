import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';

export class WeatherAccessory {
  private service: Service | null = null;
  private loggingService: { addEntry: (entry: { time: number; temp: number }) => void };

  /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
  private currentTemperature = 25;

  constructor(
        private readonly platform: BlueConnectPlatform,
        private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {

    this.accessory.log = this.platform.log;
    this.loggingService = new this.platform.fakeGatoHistoryService('weather', this.accessory, { storage: 'fs' });

    this.getWeatherTemperature().then(() => {
            // set accessory information
            this.accessory.getService(this.platform.Service.AccessoryInformation)!
              .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot');

            this.service = this.accessory.getService(
              this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor,
            );

            this.service.setCharacteristic(this.platform.Characteristic.Name, 'Current Weather Temperature');
            this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
              .onGet(this.handleCurrentTemperatureGet.bind(this));

            setInterval(() => {
              this.getWeatherTemperature().catch((error) => {
                this.platform.log.error('Error getting current temperature: ' + error);
              });
            }, 60000 * (this.platform.config.refreshInterval || 30) );
    });
  }

  /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
  async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
    if(this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentTemperature;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getWeatherTemperature() {
    this.platform.log.debug(
      'Getting weather temperature for pool ' +
        this.accessory.context.device.swimming_pool_id,
    );

    try {
      const weatherString = await this.platform.blueRiotAPI.getWeather(
        this.accessory.context.device.swimming_pool_id,
        'en',
      );

      this.platform.log.debug('Current Weather: ' + weatherString);

      const weather = JSON.parse(weatherString);

      this.currentTemperature = weather.data.temperature_current;

      this.loggingService.addEntry({ time: Math.round(new Date().valueOf() / 1000), temp: this.currentTemperature });

      this.platform.log.debug('Weather temperature: ' + this.currentTemperature);
    } catch (error) {
      this.platform.log.error('Error getting weather: ' + error);
    }
  }
}
