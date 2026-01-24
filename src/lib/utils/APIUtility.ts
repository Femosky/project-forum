import { UAParser } from 'ua-parser-js';
import DeviceDetector from 'device-detector-js';

export interface DeviceInfoType {
    browser: string | undefined;
    browserVersion: string | undefined;
    os: string | undefined;
    osVersion: string | undefined;
    deviceType: string | undefined;
    deviceBrand: string | undefined;
    deviceModel: string | undefined;
}

export class APIUtility {
    static getApiUrl(): string | Error {
        const API_URL = process.env.NEXT_PUBLIC_BACKEND_API;

        if (!API_URL) {
            return new Error('Backend API URL is not set');
        }

        return API_URL;
    }

    static getDeviceInfo(): DeviceInfoType {
        const uaString = navigator.userAgent;
        const ua = new UAParser(uaString).getResult();
        const detector = new DeviceDetector();
        const device = detector.parse(uaString);

        return {
            browser: ua.browser.name,
            browserVersion: ua.browser.version,
            os: ua.os.name,
            osVersion: ua.os.version,
            deviceType: device.device?.type,
            deviceBrand: device.device?.brand,
            deviceModel: device.device?.model,
        };
    }
}
