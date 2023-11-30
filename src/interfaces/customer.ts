import { Address } from "./address";
import { Contact } from "./contact";
import { Persons } from "./person";
import { Fleet } from "./fleet";
import { Vehicles } from "./vehicle";

export interface Customer {
    customer_name: string;
    sales_type_code_id: number;
    customer_type_code_id: number;
}

export interface Customers {
    customer: Customer,
    contactNew: Contact[],
}

export interface CustomerType {
    action_by: number;
    customer: Customer;
    addressNew: Address[];
    addressExist: number[];
    addressDelete: number[];
    contactNew: Contact[];
    contactDelete: number[];
    personNew: Persons[];
    personExist: number[];
    personDelete: number[];
    vehicleNew: Vehicles[];
    vehicleExist: number[];
    vehicleDelete: number[];
    fleetNew: Fleet[];
    fleetExist: number[];
    fleetDelete: number[];
    documentCodeNew: number[];
    documentDelete: number[];
}