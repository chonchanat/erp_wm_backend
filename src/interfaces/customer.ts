interface Customer {
    customer_name: string;
    sales_type_code_id: number;
    customer_type_code_id: number;
}

interface Address {
    address_id: number;
    name: string;
    house_no: string;
    village_no: string;
    alley: string;
    road: string;
    sub_district: string;
    district: string;
    province: string;
    postal_code: string;
    address_type_code_id: number;
}

interface Contact {
    contact_id: number;
    value: string;
    contact_code_id: number;
}

interface Persons {
    person: Person;
    contact: Contact[];
    addressNew: Address[];
    addressExist: number[];
}

interface Person {
    firstname: string;
    lastname: string;
    nickname: string;
    title_code_id: number;
    description: string;
}

export interface CustomerType {
    create_by?: number;
    customer: Customer;
    addressNew: Address[];
    addressExist: number[];
    addressDelete: number[];
    contact: Contact[];
    contactDelete: number[];
    personNew: Persons[];
    personExist: number[];
    personDelete: number[];
}