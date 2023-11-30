import { Customers } from "./customer";
import { Persons } from "./person"; 
import { Vehicles } from "./vehicle";

export interface Fleet {
    fleet_name: string;
    parent_fleet_id: number;
}

export interface FleetType {
    action_by: number,
    fleet: Fleet,
    customerNew: Customers[],
    customerDelete: number[],
    customerExist: number[],
    personNew: Persons[],
    personDelete: number[],
    personExist: number[],
    vehicleNew: Vehicles[],
    vehicleDelete: number[],
    vehicleExist: number[],
}