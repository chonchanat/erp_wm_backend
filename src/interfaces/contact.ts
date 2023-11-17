export interface Contact {
    // contact_id: number;
    value: string;
    contact_code_id: number,
    person_id: number,
    customer_id: number,
}

export interface ContactType {
    action_by: number,
    contact: Contact,
}