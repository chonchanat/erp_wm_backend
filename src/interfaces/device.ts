export interface Device {
    veh_id: string,
    device_serial_id: number,
    create_date?: string,
}

export interface DeviceConfig {
    loop_time_engine_on_code_id: number | null;
    loop_time_engine_off_code_id: number | null;
    software_version_code_id: number | null;
    ip_address_code_id: number | null;
    gateway_port_code_id: number | null;
    sms_server_number_code_id: number | null;
    sms_message_center_code_id: number | null;
    sim_serial: string | null;
    mobile_number: string | null;
    sim_type_code_id: number | null;
    network: string | null;
    username: string | null;
    password: string | null;
    description: string | null;
}

export interface Devices {
    device: Device,
    deviceConfig: DeviceConfig,
}

export interface DeviceType {
    action_by: number,
    device: Device,
    deviceConfig: DeviceConfig,
}