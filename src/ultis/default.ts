import { VehicleConfig, VehiclePermit } from "../interfaces/vehicle"
import { DeviceConfig } from "../interfaces/device"

export const vehicleConfigDefault: VehicleConfig = {
    oil_lite: 0,
    kilo_rate: 0,
    max_speed: 0,
    idle_time: 0,
    cc: 0,
    type: 0,
    max_fuel_voltage: 0,
    max_fuel_voltage_2: 0,
    max_fuel_voltage_3: 0,
    max_fuel: 0,
    max_fuel_2: 0,
    max_fuel_3: 0,
    max_empty_voltage: 0,
    max_empty_voltage_2: 0,
    max_empty_voltage_3: 0,
    fuel_status: false
}

export const vehiclePermitDefault: VehiclePermit = {
    dlt: false,
    tls: false,
    scgl: false,
    diw: false,
}

export const deviceConfigDefault: DeviceConfig = {
    loop_time_engine_on_code_id: null,
    loop_time_engine_off_code_id: null,
    software_version_code_id: null,
    ip_address_code_id: null,
    gateway_port_code_id: null,
    sms_server_number_code_id: null,
    sms_message_center_code_id: null,
    sim_serial: null,
    mobile_number: null,
    sim_type_code_id: null,
    network: null,
    username: null,
    password: null,
    description: null,
}