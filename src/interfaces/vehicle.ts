export interface Vehicle {
    frame_no: number;
    license_plate: string;
    vehicle_model_id: number;
    registration_province_code_id: number;
    registration_type_code_id: number;
    driving_license_type_code_id: number;
    number_of_axles: number;
    number_of_wheels: number;
    number_of_tires: number;
    vehicle_type_code_id: number;
}

interface VehicleConfig {
    oil_lite: number;
    kilo_rate: number;
    max_speed: number;
    idle_time: number;
    cc: number;
    type: number;
    max_fuel_voltage: number;
    max_fuel_voltage_2: number;
    max_fuel_voltage_3: number;
    max_fuel: number;
    max_fuel_2: number;
    max_fuel_3: number;
    max_empty_voltage: number;
    max_empty_voltage_2: number;
    max_empty_voltage_3: number;
    fuel_status: boolean;
}
 
interface VehiclePermit {
    dlt: boolean,
    tls: boolean,
    scgl: boolean,
    diw: boolean,
} 

export interface VehicleType {
    action_by: number,
    vehicle: Vehicle,
    vehicleConfig: VehicleConfig,
    vehiclePermit: VehiclePermit,
    customerDelete: number[],
    customerExist: number[],
    personDelete: number[],
    personExist: number[],
    documentDelete: number[],
    documentCodeNew: number[],
}