const sql = require('mssql')

export async function linkFleetCustomer(transaction: any, fleet_id: string | number, customer_id: string | number, action_by: number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('customer_id', sql.INT, customer_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
            @action_by = @action_by, @action_date = @action_date
    `)
}

export async function unlinkFleetCustomer(transaction: any, fleet_id: string | number, customer_id: string | number, action_by: number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('fleet_id', sql.INT, fleet_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id, 
                @action_by = @action_by, @action_date = @action_date
    `)
}

export async function linkFleetPerson(transaction: any, fleet_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_fleet_person @fleet_id = @fleet_id, @person_id = @person_id, 
                @action_by = @action_by, @action_date = @action_date
    `)
}

export async function unlinkFleetPerson(transaction: any, fleet_id: string | number, person_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_fleet_person @fleet_id = @fleet_id, @person_id = @person_id, 
                @action_by = @action_by, @action_date = @action_date
    `)
}