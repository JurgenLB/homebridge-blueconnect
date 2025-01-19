import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import { PoolAccessory } from './poolAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import { BlueriiotAPI } from './api/blueriiot-api.js';
import { WeatherAccessory } from './weatherAccessory';

export class BlueConnectPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public blueRiotAPI: BlueriiotAPI;
  public fakeGatoHistoryService: {
    new (type: string, accessory: PlatformAccessory, options: { storage: string }): { addEntry: (entry: { time: number; temp: number }) => void }
  };

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
        public readonly log: Logging,
        public readonly config: PlatformConfig,
        public readonly api: API,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    this.fakeGatoHistoryService = require('fakegato-history')(this.api);

    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      this.discoverDevices();
    });

    this.blueRiotAPI = new BlueriiotAPI();
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    this.accessories.push(accessory);
  }

  /**
     * Register discovered devices as accessories.
     */
  discoverDevices() {
    if (this.config.email === undefined || this.config.password === undefined) {
      this.log.warn('No email or password provided. Exiting setup');

      return;
    }

    this.blueRiotAPI.init(this.config.email, this.config.password).then(() =>{
      if(!this.blueRiotAPI.isAuthenticated()) {
        this.log.warn('BlueConnect: Unable to authenticate. Did you provide the correct email and password?');

        return;
      }

      this.log.info('BlueConnect: Logged in successfully');

      this.blueRiotAPI.getSwimmingPools().then((poolData) =>{
        const pools = JSON.parse(poolData).data;

        this.log.debug('BlueConnect: Pools: ' + JSON.stringify(pools, null, 2));
        this.log.info('BlueConnect: Found ' + pools.length + ' pools');

        const poolIds = pools.map((pool : { swimming_pool_id : string }) => pool.swimming_pool_id);

        poolIds.forEach((poolId : string) => {
          this.blueRiotAPI.getSwimmingPoolBlueDevices(poolId).then((blueDevicesData) =>{
            const blueDevices = JSON.parse(blueDevicesData).data;
            this.log.debug('BlueConnect: BlueDevices: ' + JSON.stringify(blueDevices, null, 2));
            this.log.info('BlueConnect: Found ' + blueDevices.length + ' devices');

            blueDevices.forEach((blueDevice : { blue_device_serial : string }) => {
              this.processBlueDevice(blueDevice);
            });

            this.processWeatherAccessory(poolId);
          });
        });
      }).catch((error : Error) =>{
        this.log.warn('We have issues getting the pools: ' + error);
      });
    }).catch( (error) =>{
      this.log.warn('We have issues signing in: ' + error);
    });
  }

  private processWeatherAccessory(poolId: string) {
    if (this.config.weather) {
      const uuid = this.api.hap.uuid.generate('weather-' + poolId.substring(0, 10));
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        new WeatherAccessory(this, existingAccessory);
      } else {
        this.log.info('Adding new accessory:', 'weather-' + poolId.substring(0, 10));

        const accessory = new this.api.platformAccessory('weather-' + poolId, uuid);

        accessory.context.device = { swimming_pool_id: poolId };

        new WeatherAccessory(this, accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    } else {
      // Clean up the weather accessory if it exists
      const uuid = this.api.hap.uuid.generate('weather-' + poolId.substring(0, 10));
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
      }
    }
  }

  private processBlueDevice(blueDevice: { blue_device_serial: string }) {
    const uuid = this.api.hap.uuid.generate(blueDevice.blue_device_serial);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

      new PoolAccessory(this, existingAccessory);
    } else {
      this.log.info('Adding new accessory:', blueDevice.blue_device_serial);

      const accessory = new this.api.platformAccessory(blueDevice.blue_device_serial, uuid);

      accessory.context.device = blueDevice;

      new PoolAccessory(this, accessory);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
}
