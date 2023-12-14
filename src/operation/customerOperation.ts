const sql = require('mssql')
import { Customer } from "../interfaces/customer"

export async function getCustomerTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('customer_name', sql.NVARCHAR, "%" + filter + "%")
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @customerTable IdType
            INSERT INTO @customerTable
            EXEC WDMT_MasterData..sp_filterCustomer @customer_name = @customer_name, @fleet_id = NULL, @person_id = NULL, @vehicle_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC WDMT_MasterData..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data 
            FROM WDMT_MasterData..Customer
            WHERE customer_name LIKE @customer_name AND active = 1
        `)
}

export async function getCustomerName(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT customer_id, customer_name
            FROM WDMT_MasterData..Customer
            WHERE active = 1
            ORDER BY customer_name
        `)
}

export async function getCustomerData(transaction: any, customer_id: string) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .query(`
            SELECT 
                C.customer_id, C.customer_name, 
                C.sales_type_code_id, COALESCE(M_salestype.value, '') AS sales_type, 
                C.customer_type_code_id, COALESCE(M_customertype.value, '') as customer_type
            FROM WDMT_MasterData..Customer C
            LEFT JOIN WDMT_MasterData..MasterCode M_salestype
            ON C.sales_type_code_id = M_salestype.code_id
            LEFT JOIN WDMT_MasterData..MasterCode M_customertype
            ON C.customer_type_code_id = M_customertype.code_id
            WHERE customer_id = @customer_id AND C.active = 1
            
            DECLARE @fleetTable IdType
            INSERT INTO @fleetTable
            EXEC WDMT_MasterData..sp_filterFleet @fleet_name = '%', @customer_id = @customer_id, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC WDMT_MasterData..sp_formatFleetTable @fleetTable = @fleetTable, @firstIndex = 1

            DECLARE @contactTable IdType
            INSERT INTO @contactTable
            EXEC WDMT_MasterData..sp_filterContact @value = '%', @customer_id = @customer_id, @person_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC WDMT_MasterData..sp_formatContactTable @contactTable = @contactTable, @firstIndex = 1

            DECLARE @addressTable IdType
            INSERT INTO @addressTable
            EXEC WDMT_MasterData..sp_filterAddress @location = '%', @customer_id = @customer_id, @person_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC WDMT_MasterData..sp_formatAddressTable @addressTable = @addressTable, @firstIndex = 1

            DECLARE @personTable IdType
            INSERT INTO @personTable
            EXEC WDMT_MasterData..sp_filterPerson @fullname = '%', @customer_id = @customer_id, @fleet_id = NULL, @vehicle_id = NULL, @user_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC WDMT_MasterData..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1
            
            DECLARE @vehicleTable IdType
            INSERT INTO @vehicleTable 
            EXEC WDMT_MasterData..sp_filterVehicle @license_plate = '%', @customer_id = @customer_id, @fleet_id = NULL, @package_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC WDMT_MasterData..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = 1

            DECLARE @documentTable IdType
            INSERT INTO @documentTable
            EXEC WDMT_MasterData..sp_filterDocument @document_name = '%', @customer_id = @customer_id, @person_id = NULL, 
                @address_id = NULL, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC WDMT_MasterData..sp_formatDocument @documentTable = @documentTable, @firstIndex = 1
        `)
}

export async function deleteCustomer(transaction: any, customer_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC WDMT_MasterData..sp_delete_customer @customer_id = @customer_id, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function createCustomerNew(transaction: any, customer: Customer, action_by: number, datetime: object) {
    return await transaction.request()
        .input('customer_name', sql.NVARCHAR, customer.customer_name !== "" ? customer.customer_name : null)
        .input('sales_type_code_id', sql.INT, customer.sales_type_code_id)
        .input('customer_type_code_id', sql.INT, customer.customer_type_code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC WDMT_MasterData..sp_insert_customer @customer_name = @customer_name, @sales_type_code_id = @sales_type_code_id, 
            @customer_type_code_id = @customer_type_code_id, @action_by = @action_by, @action_date = @action_date
    `)
}

export async function updateCustomer(transaction: any, customer_id: string | number, customer: Customer, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('customer_id', sql.INT, customer_id)
        .input('customer_name', sql.NVARCHAR, customer.customer_name !== "" ? customer.customer_name : null)
        .input('sales_type_code_id', sql.INT, customer.sales_type_code_id)
        .input('customer_type_code_id', sql.INT, customer.customer_type_code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC WDMT_MasterData..sp_update_customer @customer_id = @customer_id, @customer_name = @customer_name,
                @sales_type_code_id = @sales_type_code_id, @customer_type_code_id = @customer_type_code_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}