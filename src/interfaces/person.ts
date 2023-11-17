import { Address } from "./address";
import { Contact } from "./contact";
import { Card } from "./card";
import { Customers } from "./customer";

export interface Person {
    firstname: string;
    lastname: string;
    nickname: string;
    title_code_id: number;
    description: string;
    role: number[];
    roleDelete: number[];
}

export interface Persons {
    person: Person;
    contactNew: Contact[];
}

export interface PersonType {
    action_by: number;
    person: Person;
    customerNew: Customers[];
    customerDelete: number[];
    customerExist: number[];
    contactDelete: number[];
    contactNew: Contact[];
    addressNew: Address[];
    addressDelete: number[];
    addressExist: number[];
    cardNew: Card[];
    cardDelete: number[];
    documentCodeNew: number[];
    documentDelete: number[];
}