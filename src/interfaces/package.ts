export interface Package {
    vehicle_id: number,
    package_name_code_id: number,
    package_type_code_id: number,
    package_price: number,
    package_start_date: string,
    package_end_date: string,
    package_cancel_date: string
}

export interface PackageType {
    action_by: number,
    package: Package,
    vehicleDelete: number[],
    vehicleExist: number[],
    vehicleCurrent: number[],
    deviceDelete: number[],
    deviceExist: number[],
    deviceCurrent: number[]
}