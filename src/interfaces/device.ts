export interface Device {
    veh_id: number,
    device_serial_id: number,
    create_date: string,
}

export interface DeviceConfig {
    config_name: string;
    software_version: string;
    ip_address: string;
    gateway_port: string;
    sms_server_number: string;
    sms_message_center: string;
    sim_serial: string;
    mobile_number: string;
    sim_type_code_id: number;
    network: string;
    username: string;
    password: string;
}
  
export interface DeviceType {
    action_by: number,
    device: Device,
    deviceConfig: DeviceConfig,
}