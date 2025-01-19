
import { API, Characteristic, Formats, Perms, Service } from 'homebridge';


const DISPLAY_NAME = 'ORP';
const UUID = 'E863F10F-079E-48FF-8F27-9C2605A29F52';

/**
 * Attaches the 'Custom ORP' characteristic to the service.
 * @param target The service to which the characteristic should be attached.
 * @param api The Homebridge {@link API} instance in use for the plug-in.
 * @returns The {@link Characteristic} instance.
 */
export function attachCustomORPCharacteristic(target: Service, api: API): Characteristic {
  let result: Characteristic;

  if (target.testCharacteristic(DISPLAY_NAME)) {
    result = target.getCharacteristic(DISPLAY_NAME)!;
  } else {
    result = target.addCharacteristic(new api.hap.Characteristic(DISPLAY_NAME, UUID, {
      format: Formats.UINT16,
      unit: 'mBar',
      maxValue: 1100,
      minValue: 0,
      minStep: 1,
      perms: [Perms.PAIRED_READ, Perms.NOTIFY],
    }));
  }

  return result;
}
