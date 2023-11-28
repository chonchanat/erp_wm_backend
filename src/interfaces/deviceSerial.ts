export interface DeviceSerial {
    serial_id: string,
    imei_serial: string,
    device_type_code_id: number,
    create_date: string,
}

export interface DeviceSerialType {
    action_by: number;
    deviceSerial: DeviceSerial
}