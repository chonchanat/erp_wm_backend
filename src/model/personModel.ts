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
                SELECT person_id, fullname, mobile, email, description, role
                FROM (
                    SELECT
                        p.person_id, p.fullname, m.mobile, e.email, p.description,
                        STUFF ((
                            SELECT ', ' + M.value
                            FROM DevelopERP..Person_Role PR
                            LEFT JOIN DevelopERP..MasterCode M
                            ON PR.role_code_id = M.code_id
                            WHERE PR.person_id = p.person_id
                            FOR XML PATH('')
                        ), 1, 2, '') AS role,
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
                    role_code_id, value AS role_type
                FROM DevelopERP..Person_Role PR
                LEFT JOIN DevelopERP..MasterCode M
                ON PR.role_code_id = M.code_id
                WHERE person_id = @person_id
                
                SELECT
                    t1.customer_id, customer_name, phone, email
                FROM (
                    SELECT
                        C.customer_id,
                        C.customer_name,
                        COALESCE(Cphone.value, '-') AS phone,
                        COALESCE(Cemail.value, '-') AS email,
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
                ) t1
                LEFT JOIN DevelopERP..Customer_Person CP
                ON t1.customer_id = CP.customer_id
                WHERE CP.person_id = @person_id

                SELECT
                    c.contact_id,
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
            role: result.recordsets[1],
            customer: result.recordsets[2],
            contact: result.recordsets[3],
            address: result.recordsets[4]
        };
    } catch (err) {
        throw err;
    }
}

export default { getPersonTable, getPersonData }