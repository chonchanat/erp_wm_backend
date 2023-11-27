export interface Device {
    veh_id: number,
    device_serial_id: number,
    create_date: string,
}

export interface DeviceConfig {
    loop_time_engine_on_code_id: number;
    loop_time_engine_off_code_id: number;
    software_version_code_id: number;
    ip_address_code_id: number;
    gateway_port_code_id: number;
    sms_server_number_code_id: number;
    sms_message_center_code_id: number;
    sim_serial: string;
    mobile_number: string;
    sim_type_code_id: number;
    network: string;
    username: string;
    password: string;
    description: string;
}
  
export interface DeviceType {
    action_by: number,
    device: Device,
    deviceConfig: DeviceConfig,
}