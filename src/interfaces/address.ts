export interface Address {
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
    address_type_code_idDelete: number[];
    address_type_code_id: number[];
}

export interface AddressType {
    create_by?: number;
    update_by?: number;
    address: Address;
    documentCodeNew: number[];
    documentDelete: number[];
}