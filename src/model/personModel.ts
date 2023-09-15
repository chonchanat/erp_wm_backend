const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getPersonTable(index: number, filterPerson: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('fullname', sql.NVARCHAR, "%" + filterPerson + "%")
            .query(`
                SELECT person_id, fullname, mobile, email, description
                FROM (
                    SELECT
                        p.person_id, p.fullname, m.mobile, e.email, p.description,
                        CAST(ROW_NUMBER () OVER (ORDER BY p.person_id) AS INT) AS RowNum
                    FROM (
                        SELECT 
                            person_id,
                            COALESCE(firstname + ' ', '') + COALESCE(lastname + ' ', '') + COALESCE('(' + nickname + ')', '') AS fullname,
                            COALESCE(description, '-') as description
                        FROM DevelopERP..Person
                    ) p
                    LEFT JOIN (
                        SELECT person_id, MAX(value) AS email
                        FROM DevelopERP..Contact
                        WHERE contact_code_id = 3
                        GROUP BY person_id
                    ) e
                    ON p.person_id = e.person_id
                    LEFT JOIN (
                        SELECT person_id, MAX(value) AS mobile
                        FROM DevelopERP..Contact
                        WHERE contact_code_id = 2
                        GROUP BY person_id
                    ) m
                    ON p.person_id = m.person_id
                    WHERE p.fullname LIKE @fullname
                ) SubQuery
                WHERE (@firstIndex = 0 OR @lastIndex = 0 OR RowNum BETWEEN @firstIndex AND @lastIndex)

                SELECT COUNT(*) AS count_data
                FROM (
                    SELECT 
                    person_id,
                    COALESCE(firstname + ' ', '') + COALESCE(lastname, '') + COALESCE('(' + nickname + ')', '') AS fullname
                    FROM DevelopERP..Person
                ) t
                WHERE fullname LIKE @fullname
            `)
        return {
            person: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getPersonData(personId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('person_id', sql.INT, personId)
            .query(`
                SELECT
                    p.person_id as person_id,
                    COALESCE(p.firstname, '') as firstname,
                    COALESCE(p.lastname, '') as lastname,
                    COALESCE(p.nickname, '') as nickname,
                    m.code_id as title_code_id,
                    m.value as title_type,
                    COALESCE(p.description, '') as description
                FROM DevelopERP..Person p
                LEFT JOIN DevelopERP..MasterCode m
                on p.title_code_id = m.code_id
                WHERE person_id = @person_id
                
                SELECT
                    SubQuery.customer_id, customer_name, sales_type_code_id, customer_type_code_id, COALESCE(phone, '') as phone, COALESCE(email, '') as email
                FROM (
                    SELECT
                        C.customer_id,
                        C.customer_name,
                        C.sales_type_code_id,
                        C.customer_type_code_id,
                        Cphone.value AS phone,
                        Cemail.value AS email,
                        ROW_NUMBER() OVER (ORDER BY C.customer_id) AS RowNum
                    FROM DevelopERP..Customer C
                    LEFT JOIN (
                        SELECT customer_id, min(contact_code_id) as contact_code_id, max(value) as value
                        FROM DevelopERP..Contact
                        WHERE contact_code_id = 2
                        GROUP BY customer_id
                    ) Cphone
                    ON C.customer_id = Cphone.customer_id AND Cphone.contact_code_id = 2
                    LEFT JOIN(
                        SELECT customer_id, min(contact_code_id) as contact_code_id, max(value) as value
                        FROM DevelopERP..Contact
                        WHERE contact_code_id = 3
                        GROUP BY customer_id
                    ) Cemail
                    ON C.customer_id = Cemail.customer_id AND Cemail.contact_code_id = 3
                ) AS SubQuery
                LEFT JOIN DevelopERP..Customer_Person cp
                ON SubQuery.customer_id = cp.customer_id
                LEFT JOIN DevelopERP..Person p
                ON cp.person_id = p.person_id
                WHERE p.person_id = @person_id

                SELECT
                    m.value as contact_type,
                    c.value as contact_value
                FROM DevelopERP..Person p
                LEFT JOIN DevelopERP..Contact c
                ON p.person_id = c.person_id
                LEFT JOIN DevelopERP..MasterCode m
                ON c.contact_code_id = m.code_id
                WHERE p.person_id = @person_id

                SELECT *
                FROM DevelopERP..Person p
                INNER JOIN DevelopERP..Address_Person ap
                ON p.person_id = ap.person_id
                INNER JOIN DevelopERP..Address a
                ON ap.address_id = a.address_id
                WHERE p.person_id = @person_id
                
            `)
        return {
            person: result.recordsets[0][0],
            customer: result.recordsets[1],
            contact: result.recordsets[2],
            address: result.recordsets[3]
        };
    } catch (err) {
        throw err;
    }
}

export default { getPersonTable, getPersonData }