import { Address } from "./address";
import { Contact } from "./contact";
import { Person } from "./person";
import { Fleet } from "./fleet";
import { Vehicle } from "./vehicle";

export interface Customer {
    customer_name: string;
    sales_type_code_id: number;
    customer_type_code_id: number;
}

interface Persons {
    person: Person;
    contact: Contact[];
    addressNew: Address[];
    addressExist: number[];
}

export interface CustomerType {
    create_by?: number;
    update_by?: number;
    customer: Customer;
    addressNew: Address[];
    addressExist: number[];
    addressDelete: number[];
    contact: Contact[];
    contactDelete: number[];
    personNew: Persons[];
    personExist: number[];
    personDelete: number[];
    vehicleNew: Vehicle[];
    vehicleExist: number[];
    vehicleDelete: number[];
    fleetNew: Fleet[];
    fleetExist: number[];
    fleetDelete: number[];
    documentCodeNew: number[];
    documentDelete: number[];
}