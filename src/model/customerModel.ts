import { getDateTime } from "../utils"
import { CustomerType } from "../interfaces/customer";

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getCustomerTable(index: number, filterCustomerName: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('customer_name', sql.NVARCHAR, "%" + filterCustomerName + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @customerTable CustomerType
                INSERT INTO @customerTable
                EXEC DevelopERP_ForTesting..sp_filterCustomer @fleet_id = NULL, @person_id = NULL, @vehicle_id = NULL
                EXEC DevelopERP_ForTesting..sp_formatCustomerTable @customerTable = @customerTable, @customer_name = '%', @firstIndex = @firstIndex, @lastIndex = @lastIndex

                SELECT COUNT(*) AS count_data 
                FROM DevelopERP_ForTesting..Customer
                WHERE customer_name LIKE @customer_name AND is_archived = 0
            `)
        return {
            customer: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getCustomerData(customerId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('customer_id', sql.INT, customerId)
            .query(`
                SELECT C.customer_id, C.customer_name, C.sales_type_code_id, MC1.value AS sales_type, C.customer_type_code_id, MC2.value as customer_type
                FROM DevelopERP_ForTesting..Customer C
                INNER JOIN DevelopERP_ForTesting..MasterCode MC1
                ON C.sales_type_code_id = MC1.code_id
                INNER JOIN DevelopERP_ForTesting..MasterCode MC2
                ON C.customer_type_code_id = MC2.code_id
                WHERE customer_id = @customer_id AND is_archived = 0

                DECLARE @fleetTable FleetType
                INSERT INTO @fleetTable
                EXEC DevelopERP_ForTesting..sp_filterFleet @customer_id = @customer_id
                EXEC DevelopERP_ForTesting..sp_formatFleetTable @fleetTable = @fleetTable, @fleet_name = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @contactTable ContactType
                INSERT INTO @contactTable
                SELECT *
                FROM DevelopERP_ForTesting..Contact
                WHERE customer_id = @customer_id
                EXEC DevelopERP_ForTesting..sp_formatContactTable @contactTable = @contactTable, @value = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @addressTable AddressType
                INSERT INTO @addressTable
                SELECT A.address_id, A.name, A.house_no, A.village_no, A.alley, A.road, A.sub_district, A.district, A.province, A.postal_code, A.create_by, A.create_date, A.update_date, A.is_archived
                FROM DevelopERP_ForTesting..Address_Customer AC
                LEFT JOIN DevelopERP_ForTesting..Address A
                ON AC.address_id = A.address_id
                WHERE AC.customer_id = @customer_id
                EXEC DevelopERP_ForTesting..sp_formatAddressTable @addressTable = @addressTable, @location = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @personTable PersonType
                INSERT INTO @personTable
                EXEC DevelopERP_ForTesting..sp_filterPerson @customer_id = @customer_id, @fleet_id = NULL, @vehicle_id = NULL
                EXEC DevelopERP_ForTesting..sp_formatPersonTable @personTable = @personTable, @fullname = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @vehicleTable VehicleType
                INSERT INTO @vehicleTable
                EXEC DevelopERP_ForTesting..sp_filterVehicle @customer_id = @customer_id, @fleet_id = NULL
                EXEC DevelopERP_ForTesting..sp_formatVehicleTable @vehicleTable = @vehicleTable, @license_plate = '%', @firstIndex = 0, @lastIndex = 0
            `)
        return {
            customer: result.recordsets[0][0],
            fleet: result.recordsets[1],
            contact: result.recordsets[2],
            address: result.recordsets[3],
            person: result.recordsets[4],
            vehicle: result.recordsets[5]
        };
    } catch (err) {
        throw err;
    }
}

async function deleteCustomer(customerId: string) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('customer_id', sql.INT, customerId)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE DevelopERP_ForTesting..Customer
                SET is_archived = 1, update_date = @update_date
                WHERE customer_id = @customer_id
            `)
    } catch (err) {
        throw err;
    }
}

const customerQuery = `
INSERT INTO DevelopERP_ForTesting..Customer (customer_name, sales_type_code_id, customer_type_code_id, create_date, create_by, is_archived)
OUTPUT INSERTED.customer_id
VALUES (@customer_name, @sales_type_code_id, @customer_type_code_id, @create_date, @create_by, @is_archived)
`;
const addressQuery = `
INSERT INTO DevelopERP_ForTesting..Address (name, house_no, village_no, alley, road, sub_district, district, province, postal_code, create_by, create_date, is_archived)
OUTPUT INSERTED.address_id
VALUES (@name, @house_no, @village_no, @alley, @road, @sub_district, @district, @province, @postal_code, @create_by, @create_date, @is_archived)
`;
const addressCustomerQuery = `
INSERT INTO DevelopERP_ForTesting..Address_Customer (customer_id, address_id)
VALUES (@customer_id, @address_id)
`;
const addressMasterCodeQuery = `
INSERT INTO DevelopERP_ForTesting..Address_MasterCode (address_id, address_type_code_id)
VALUES (@address_id, @address_type_code_id)
`
const addressCustomerDeleteQuery = `
DELETE FROM DevelopERP_ForTesting..Address_Customer
WHERE customer_id = @customer_id AND address_id = @address_id
`
const contactQuery = `
INSERT INTO DevelopERP_ForTesting..Contact (customer_id, value, contact_code_id, create_by, create_date, is_archived)
VALUES (@customer_id, @value, @contact_code_id, @create_by, @create_date, @is_archived)
`;
const contactDeleteQuery = `
UPDATE DevelopERP_ForTesting..Contact
SET is_archived = 1
WHERE contact_id = @contact_id AND customer_id = @customer_id
`
const personQuery = `
INSERT INTO DevelopERP_ForTesting..Person (firstname, lastname, nickname, title_code_id, description, create_by, create_date, is_archived)
OUTPUT INSERTED.person_id
VALUES (@firstname, @lastname, @nickname, @title_code_id, @description, @create_by, @create_date, @is_archived)
`;
const roleQuery = `
INSERT INTO DevelopERP_ForTesting..Person_Role (person_id, role_code_id)
VALUES (@person_id, @role_code_id)
`
const personDeleteQuery = `
DELETE FROM DevelopERP_ForTesting..Customer_Person
WHERE customer_id = @customer_id AND person_id = @person_id
`
const customerPersonQuery = `
INSERT INTO DevelopERP_ForTesting..Customer_Person (customer_id, person_id)
VALUES (@customer_id, @person_id)
`
const addressPersonQuery = `
INSERT INTO DevelopERP_ForTesting..Address_Person (person_id, address_id)
VALUES (@person_id, @address_id)
`;
const contactPersonQuery = `
INSERT INTO DevelopERP_ForTesting..Contact (person_id, value, contact_code_id, create_by, create_date, is_archived)
VALUES (@person_id, @value, @contact_code_id, @create_by, @create_date, @is_archived)
`

async function createCustomerData(body: CustomerType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()
        // const request = transaction.request();

        let customerResult = await transaction.request()
            .input('customer_name', sql.NVARCHAR, body.customer.customer_name === "" ? null : body.customer.customer_name)
            .input('sales_type_code_id', sql.INT, body.customer.sales_type_code_id)
            .input('customer_type_code_id', sql.INT, body.customer.customer_type_code_id)
            .input('create_date', sql.DATETIME, datetime)
            .input('create_by', sql.INT, body.create_by)
            .input('is_archived', sql.INT, 0)
            .query(customerQuery)
        let customer_id = customerResult.recordset[0].customer_id

        for (const address of body.addressNew) {
            let addressResult = await transaction.request()
                .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
                .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
                .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
                .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
                .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
                .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
                .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
                .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
                .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
                .input('create_by', sql.INT, body.create_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('is_archived', sql.INT, 0)
                .query(addressQuery)
            const address_id = addressResult.recordset[0].address_id
            let addressCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('address_id', sql.INT, address_id)
                .query(addressCustomerQuery)
            for (const addressMasterCode of address.address_type_code_id) {
                let addressMasterCodeResult = await transaction.request()
                    .input('address_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, addressMasterCode)
                    .query(addressMasterCodeQuery)
            }
        }

        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('address_id', sql.INT, address)
                .query(addressCustomerQuery)
        }

        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('create_by', sql.INT, body.create_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('is_archived', sql.INT, 0)
                .query(contactQuery)
        }

        // 
        for (const person of body.personNew) {
            let personResult = await transaction.request()
                .input('firstname', sql.NVARCHAR, person.person.firstname === "" ? null : person.person.firstname)
                .input('lastname', sql.NVARCHAR, person.person.lastname === "" ? null : person.person.lastname)
                .input('nickname', sql.NVARCHAR, person.person.nickname === "" ? null : person.person.nickname)
                .input('title_code_id', sql.Int, person.person.title_code_id)
                .input('description', sql.NVARCHAR, person.person.description === "" ? null : person.person.description)
                .input('create_by', sql.INT, body.create_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('is_archived', sql.INT, 0)
                .query(personQuery)
            let person_id = personResult.recordset[0].person_id
            let personCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('person_id', sql.INT, person_id)
                .query(customerPersonQuery)

            for (const role of person.person.role) {
                let roleResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('role_code_id', sql.INT, role)
                    .query(roleQuery)
            }

            for (const address of person.addressNew) {
                let addressResult = await transaction.request()
                    .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
                    .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
                    .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
                    .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
                    .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
                    .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
                    .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
                    .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
                    .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
                    .input('create_by', sql.INT, body.create_by)
                    .input('create_date', sql.DATETIME, datetime)
                    .input('is_archived', sql.INT, 0)
                    .query(addressQuery)
                const address_id = addressResult.recordset[0].address_id
                let addressPersonResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address_id)
                    .query(addressPersonQuery)
                for (const addressMasterCode of address.address_type_code_id) {
                    let addressMasterCodeResult = await transaction.request()
                        .input('address_id', sql.INT, address_id)
                        .input('address_type_code_id', sql.INT, addressMasterCode)
                        .query(addressMasterCodeQuery)
                }
            }

            for (const address of body.addressExist) {
                let addressResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address)
                    .query(addressPersonQuery)
            }

            for (const contact of person.contact) {
                let contactResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                    .input('contact_code_id', sql.INT, contact.contact_code_id)
                    .input('create_by', sql.INT, body.create_by)
                    .input('create_date', sql.DATETIME, datetime)
                    .input('is_archived', sql.INT, 0)
                    .query(contactPersonQuery)
            }
        }
        // 
        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('person_id', sql.INT, person)
                .query(customerPersonQuery)
        }

        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await transaction.request()
                .input('frame_no', sql.INT, vehicle.frame_no)
                .input('license_plate', sql.INT, vehicle.license_plate)
                .input('number_of_shaft', sql.INT, vehicle.number_of_shaft)
                .input('number_of_wheel', sql.INT, vehicle.number_of_wheel)
                .input('number_of_tire', sql.INT, vehicle.number_of_tire)
                .input('person_id', sql.INT, vehicle.person_id)
                .input('billing_location_id', sql.INT, vehicle.billing_location_id)
                .input('create_by', sql.INT, body.create_by)
                .input('create_date', sql.DATE, datetime)
                .input('is_archived', sql.INT, 0)
                .query(`
                    INSERT INTO DevelopERP_ForTesting..Vehicle (frame_no, license_plate, number_of_shaft, number_of_wheel, number_of_tire, person_id, billing_location_id, create_by, create_date, is_archived)
                    VALUES (@frame_no, @license_plate, @number_of_shaft, @number_of_wheel, @number_of_tire, @person_id, @billing_location_id, @create_by, @create_date, @is_archived)
                `)
        }

        for (const vehicle of body.vehicleExist) {
            let vehicleResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('vehicle_id', sql.INT, vehicle)
                .query(`
                    INSERT INTO DevelopERP_ForTesting..Customer_Vehicle (customer_id, vehicle_id)
                    VALUES (@customer_id, @vehicle_id)
                `)
        }

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateCustomerData(customerId: string, body: CustomerType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let customerResult = await transaction.request()
            .input('customer_id', sql.INT, customerId)
            .input('customer_name', sql.NVARCHAR, body.customer.customer_name)
            .input('sales_type_code_id', sql.INT, body.customer.sales_type_code_id)
            .input('customer_type_code_id', sql.INT, body.customer.customer_type_code_id)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE DevelopERP_ForTesting..Customer
                SET customer_name = @customer_name, sales_type_code_id = @sales_type_code_id, customer_type_code_id = @customer_type_code_id, update_date = @update_date
                WHERE customer_id = @customer_id
            `)

        for (const address of body.addressNew) {
            let addressResult = await transaction.request()
                .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
                .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
                .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
                .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
                .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
                .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
                .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
                .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
                .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
                .input('create_by', sql.INT, body.update_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('is_archived', sql.INT, 0)
                .query(addressQuery)
            const address_id = addressResult.recordset[0].address_id
            let addressCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address_id)
                .query(addressCustomerQuery)
            for (const addressMasterCode of address.address_type_code_id) {
                let addressMasterCodeResult = await transaction.request()
                    .input('address_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, addressMasterCode)
                    .query(addressMasterCodeQuery)
            }
        }

        for (const address of body.addressDelete) {
            let addressDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address)
                .query(addressCustomerDeleteQuery)
        }
        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address)
                .query(addressCustomerQuery)
        }

        for (const contact of body.contactDelete) {
            let contactDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('contact_id', sql.INT, contact)
                .query(contactDeleteQuery)
        }
        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('create_by', sql.INT, body.update_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('is_archived', sql.INT, 0)
                .query(contactQuery)
        }

        // 
        for (const person of body.personNew) {
            let personResult = await transaction.request()
                .input('firstname', sql.NVARCHAR, person.person.firstname === "" ? null : person.person.firstname)
                .input('lastname', sql.NVARCHAR, person.person.lastname === "" ? null : person.person.lastname)
                .input('nickname', sql.NVARCHAR, person.person.nickname === "" ? null : person.person.nickname)
                .input('title_code_id', sql.Int, person.person.title_code_id)
                .input('description', sql.NVARCHAR, person.person.description === "" ? null : person.person.description)
                .input('create_by', sql.INT, body.update_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('is_archived', sql.INT, 0)
                .query(personQuery)
            let person_id = personResult.recordset[0].person_id
            let personCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person_id)
                .query(customerPersonQuery)

            for (const role of person.person.role) {
                let roleResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('role_code_id', sql.INT, role)
                    .query(roleQuery)
            }

            for (const address of person.addressNew) {
                let addressResult = await transaction.request()
                    .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
                    .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
                    .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
                    .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
                    .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
                    .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
                    .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
                    .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
                    .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
                    .input('create_by', sql.INT, body.update_by)
                    .input('create_date', sql.DATETIME, datetime)
                    .input('is_archived', sql.INT, 0)
                    .query(addressQuery)
                const address_id = addressResult.recordset[0].address_id
                let addressPersonResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address_id)
                    .query(addressPersonQuery)
                for (const addressMasterCode of address.address_type_code_id) {
                    let addressMasterCodeResult = await transaction.request()
                        .input('address_id', sql.INT, address_id)
                        .input('address_type_code_id', sql.INT, addressMasterCode)
                        .query(addressMasterCodeQuery)
                }
            }

            for (const address of body.addressExist) {
                let addressResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address)
                    .query(addressPersonQuery)
            }

            for (const contact of person.contact) {
                let contactResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                    .input('contact_code_id', sql.INT, contact.contact_code_id)
                    .input('create_by', sql.INT, body.update_by)
                    .input('create_date', sql.DATETIME, datetime)
                    .input('is_archived', sql.INT, 0)
                    .query(contactPersonQuery)
            }
        }

        for (const person of body.personDelete) {
            let personDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person)
                .query(personDeleteQuery)
        }
        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person)
                .query(customerPersonQuery)
        }
        //

        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await transaction.request()
                .input('frame_no', sql.INT, vehicle.frame_no)
                .input('license_plate', sql.INT, vehicle.license_plate)
                .input('number_of_shaft', sql.INT, vehicle.number_of_shaft)
                .input('number_of_wheel', sql.INT, vehicle.number_of_wheel)
                .input('number_of_tire', sql.INT, vehicle.number_of_tire)
                .input('person_id', sql.INT, vehicle.person_id)
                .input('billing_location_id', sql.INT, vehicle.billing_location_id)
                .input('create_by', sql.INT, body.update_by)
                .input('create_date', sql.DATE, datetime)
                .input('is_archived', sql.INT, 0)
                .query(`
                    INSERT INTO DevelopERP_ForTesting..Vehicle (frame_no, license_plate, number_of_shaft, number_of_wheel, number_of_tire, person_id, billing_location_id, create_by, create_date, is_archived)
                    VALUES (@frame_no, @license_plate, @number_of_shaft, @number_of_wheel, @number_of_tire, @person_id, @billing_location_id, @create_by, @create_date, @is_archived)
                `)
        }

        for (const vehicle of body.vehicleDelete) {
            let vehicleDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('vehicle_id', sql.INT, vehicle)
                .query(`
                    DELETE FROM DevelopERP_ForTesting..Customer_Vehicle
                    WHERE customer_id = @customer_id AND vehicle_id = @vehicle_id
                `)
        }
        for (const vehicle of body.vehicleExist) {
            let vehicleResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('vehicle_id', sql.INT, vehicle)
                .query(`
                    INSERT INTO DevelopERP_ForTesting..Customer_Vehicle (customer_id, vehicle_id)
                    VALUES (@customer_id, @vehicle_id)
                `)
        }

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getCustomerTable, getCustomerData, deleteCustomer, createCustomerData, updateCustomerData } 