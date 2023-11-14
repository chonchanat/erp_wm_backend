export interface DeviceSerial {
    serial_id: string,
    imei_serial: string,
    dvr_id: string,
    device_type_code_id: number,
    create_date: string,
}

export interface DeviceSerialType {
    create_by?: number;
    update_by?: number;
    deviceSerial: DeviceSerial
}