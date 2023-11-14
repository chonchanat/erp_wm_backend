import { Address } from "./address";
import { Contact } from "./contact";
import { Card } from "./card";

export interface Person {
    firstname: string;
    lastname: string;
    nickname: string;
    title_code_id: number;
    description: string;
    role: number[];
    roleDelete: number[];
}

export interface PersonType {
    create_by?: number;
    update_by?: number;
    person: Person;
    customerDelete: number[];
    customerExist: number[];
    contactDelete: number[];
    contact: Contact[];
    addressNew: Address[];
    addressDelete: number[];
    addressExist: number[];
    cardNew: Card[];
    cardDelete: number[];
    documentCodeNew: number[];
    documentDelete: number[];
}