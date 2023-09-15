const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getAddressTable(index: number, filterLocation: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('location', sql.NVARCHAR, "%" + filterLocation + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            // .query('EXEC DevelopERP..getAddressTable @index');
            .query(`
                SELECT address_id, location, address_type
                    FROM (
                        SELECT 
                            *,
                            CAST(ROW_NUMBER () OVER (ORDER BY address_id) AS INT) AS RowNum
                        FROM (
                            SELECT 
                                A.address_id,
                                COALESCE(A.name + ', ', '') + 
                                COALESCE(A.house_no + ', ', '') +
                                COALESCE('หมู่ที่ ' + A.village_no + ', ', '') + 
                                COALESCE('ซอย' + A.alley + ', ', '') +
                                COALESCE('ถนน' + A.road + ', ', '') + 
                                COALESCE(A.sub_district + ', ', '') +
                                COALESCE(A.district + ', ', '') +
                                COALESCE(A.province + ', ', '') +
                                COALESCE(A.postal_code , '') as location,
                                STUFF((
                                    SELECT ', ' + M.value
                                    FROM DevelopERP..Address_MasterCode AM
                                    LEFT JOIN DevelopERP..MasterCode M
                                    ON AM.address_type_code_id = M.code_id
                                    WHERE AM.address_id = A.address_id
                                    FOR XML PATH('')
                                ), 1, 2, '') AS address_type
                            FROM DevelopERP..Address A
                        ) t1
                        WHERE location LIKE @location
                    ) t2            
                WHERE (@firstIndex = 0 OR @lastIndex = 0 OR RowNum BETWEEN @firstIndex AND @lastIndex)

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
                        FROM DevelopERP..Address
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
                        FROM DevelopERP..Address_MasterCode AM
                        LEFT JOIN DevelopERP..MasterCode M
                        ON AM.address_type_code_id = M.code_id
                        WHERE AM.address_id = A.address_id
                        FOR XML PATH('')
                    ), 1, 2, '') AS address_type
                FROM DevelopERP..Address A
                WHERE A.address_id = @address_id

                SELECT
                    am.address_type_code_id,
                    m.value as address_type
                FROM DevelopERP..Address_MasterCode am
                LEFT JOIN DevelopERP..MasterCode m
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