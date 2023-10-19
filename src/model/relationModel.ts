const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function deleteCustomerAddress(customerId: string, addressId: string) {
    try {
        let pool = await sql.connect(devConfig)
        // await pool.request()
        //     .input('customer_id', sql.INT, customerId)
        //     .input('address_id', sql.INT, addressId)
        //     .query(`
        //         DELETE FROM DevelopERP_ForTesting..Address_Customer
        //         WHERE customer_id = @customerId AND address_id = @addressId
        //     `)
    } catch (err) {
        throw err;
    }
}
async function deleteCustomerPerson(customerId: string, personId: string) {
    try {
        let pool = await sql.connect(devConfig)
        // await pool.request()
        //     .input('customer_id', sql.INT, customerId)
        //     .input('person_id', sql.INT, personId)
        //     .query(`
        //         DELETE FROM DevelopERP_ForTesting..Customer_Person
        //         WHERE customer_id = @customer_id AND person_id = @person_id
        //     `)
    } catch (err) {
        throw err;
    }
}

async function deleteCustomerContact(customerId: string, contactId: string) {
    try {
        let pool = await sql.connect(devConfig)
        // await pool.request()
        //     .input('customer_id', sql.INT, customerId)
        //     .input('contact_id', sql.INT, contactId)
        //     .query(`
        //         DELETE FROM DevelopERP_ForTesting..Contact
        //         WHERE customer_id = @customer_id AND contact_id = @contact_id
        //     `)
    } catch (err) {
        throw err;
    }
}

export default { deleteCustomerAddress, deleteCustomerPerson, deleteCustomerContact }