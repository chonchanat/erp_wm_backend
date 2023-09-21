const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getAddressTable(index: number, filterLocation: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('location', sql.NVARCHAR, "%" + filterLocation + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            // .query('EXEC chonTest..getAddressTable @index');
            .query(`
                EXEC chonTest..getAddressTable @location = @location, @firstIndex= @firstIndex, @lastIndex= @lastIndex

                SELECT COUNT(*) AS count_data
                FROM (
                        SELECT 
                        COALESCE(name + ', ', '') +
                        COALESCE(house_no + ', ', '') +
                        COALESCE('หมู่ที่ ' + village_no + ', ', '') + 
                        COALESCE('ซอย' + alley + ', ', '') +
                        COALESCE('ถนน' + road + ', ', '') + 
                        COALESCE(sub_district + ', ', '') +
                        COALESCE(district + ', ', '') +
                        COALESCE(province + ', ', '') +
                        COALESCE(postal_code , '') as location
                        FROM chonTest..Address
                ) t
                WHERE location LIKE @location
            `)
        return {
            address: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getAddressData(addressId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('address_id', sql.INT, addressId)
            .query(`
                SELECT
                    COALESCE(A.name, '') AS name,
                    COALESCE(A.house_no, '') AS house_no,
                    COALESCE(A.village_no, '') AS village_no,
                    COALESCE(A.alley, '') AS alley,
                    COALESCE(A.road, '') AS road,
                    COALESCE(A.sub_district, '') AS sub_district,
                    COALESCE(A.district, '') AS district,
                    COALESCE(A.province, '') AS province,
                    COALESCE(A.postal_code, '') AS postal_code,
                    STUFF((
                        SELECT ', ' + M.value
                        FROM chonTest..Address_MasterCode AM
                        LEFT JOIN chonTest..MasterCode M
                        ON AM.address_type_code_id = M.code_id
                        WHERE AM.address_id = A.address_id
                        FOR XML PATH('')
                    ), 1, 2, '') AS address_type
                FROM chonTest..Address A
                WHERE A.address_id = @address_id

                SELECT
                    am.address_type_code_id,
                    m.value as address_type
                FROM chonTest..Address_MasterCode am
                LEFT JOIN chonTest..MasterCode m
                ON am.address_type_code_id = m.code_id
                WHERE am.address_id = @address_id
            `)
        return {
            address: result.recordsets[0],
            address_type: result.recordsets[1],
        };
    } catch (err) {
        throw err;
    }
}
export default { getAddressTable, getAddressData }