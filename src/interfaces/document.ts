export interface Document {
    document_name: string,
    document_code_id: number,
    customer_id: number,
    person_id: number,
    address_id: number,
    vehicle_id: number,
}

export interface DocumentType {
    action_by: number,
    document: Document
}