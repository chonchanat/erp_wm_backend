import { Customers } from "./customer";

export interface Fleet {
    fleet_name: string;
    parent_fleet_id: number;
}

export interface FleetType {
    create_by?: number,
    update_by?: number,
    fleet: Fleet,
    customerNew: Customers[],
    customerDelete: number[],
    customerExist: number[],
    personDelete: number[],
    personExist: number[],
    vehicleDelete: number[],
    vehicleExist: number[],
}