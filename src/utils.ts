export function getDateTime() {
    let date = new Date();
    let utc7date = new Date(date.getTime() + 7 * 60 * 60 * 1000);

    return utc7date;
}

export const vehicleConfigDefault = {
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

export const vehiclePermitDefault = {
    dlt: false,
    tls: false,
    scgl: false,
    diw: false,
}