const sql = require('mssql')

export async function linkFleetCustomer(transaction: any, fleet_id: string | number, customer_id: string | number, action_by: number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('customer_id', sql.INT, customer_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
            @action_by = @action_by, @action_by = @action_by
    `)
}
export async function unlinkFleetCustomer(transaction: any, fleet_id: string | number, customer_id: string | number, action_by: number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('fleet_id', sql.INT, fleet_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id, 
                @action_by = @action_by, @action_by = @action_by
    `)
}

export async function linkFleetPerson(transaction: any, fleet_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_fleet_person @fleet_id = @fleet_id, @person_id = @person_id, 
                @action_by = @action_by, @action_by = @action_by
    `)
}
export async function unlinkFleetPerson(transaction: any, fleet_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_fleet_person @fleet_id = @fleet_id, @person_id = @person_id, 
                @action_by = @action_by, @action_by = @action_by
    `)
}

export async function linkPersonRole(transaction: any, person_id: string | number, role_code_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .input('role_code_id', sql.INT, role_code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_person_role @person_id = @person_id, @role_code_id = @role_code_id,
                @action_by = @action_by, @action_by = @action_by
    `)
}
export async function unlinkPersonRole(transaction: any, person_id: string | number, role_code_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .input('role_code_id', sql.INT, role_code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_person_role @person_id = @person_id, @role_code_id = @role_code_id,    
                @action_by = @action_by, @action_by = @action_by
        `)
}

export async function linkCustomerPerson(transaction: any, customer_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_customer_person @customer_id = @customer_id, @person_id = @person_id,
                @action_by = @action_by, @action_by = @action_by
        `)
}
export async function unlinkCustomerPerson(transaction: any, customer_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .input('customer_id', sql.INT, customer_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_customer_person @customer_id = @customer_id, @person_id = @person_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function linkAddressCustomer(transaction: any, address_id: string | number, customer_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('address_id', sql.INT, address_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_address_customer @address_id = @address_id, @customer_id = @customer_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}
export async function unlinkAddressCustomer(transaction: any, address_id: string | number, customer_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('address_id', sql.INT, address_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_address_customer @address_id = @address_id, @customer_id = @customer_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function linkAddressPerson(transaction: any, address_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .input('address_id', sql.INT, address_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_address_person @address_id = @address_id, @person_id = @person_id,
            @action_by = @action_by, @action_by = @action_by
    `)
}
export async function unlinkAddressPerson(transaction: any, address_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .input('address_id', sql.INT, address_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_address_person @address_id = @address_id, @person_id = @person_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function linkAddressMasterCode(transaction: any, address_id: string | number, address_type_code_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('address_id', sql.INT, address_id)
        .input('address_type_code_id', sql.INT, address_type_code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
    EXEC DevelopERP_Clear..sp_insert_address_mastercode @address_id = @address_id, @address_type_code_id = @address_type_code_id, 
        @action_by = @action_by, @action_by = @action_by
    `)
}
export async function unlinkAddressMasterCode(transaction: any, address_id: string | number, address_type_code_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('address_id', sql.INT, address_id)
        .input('address_type_code_id', sql.INT, address_type_code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_address_mastercode @address_id = @address_id, @address_type_code_id = @address_type_code_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function linkVehicleCustomer(transaction: any, vehicle_id: string | number, customer_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('customer_id', sql.INT, customer_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}
export async function unlinkVehicleCustomer(transaction: any, vehicle_id: string | number, customer_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function linkVehiclePerson(transaction: any, vehicle_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}
export async function unlinkVehiclePerson(transaction: any, vehicle_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}