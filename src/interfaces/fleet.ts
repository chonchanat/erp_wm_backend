export interface Fleet {
    fleet_name: string;
    parent_fleet_id: number;
}

export interface FleetType {
    action_by: number,
    fleet: Fleet,
    customerDelete: number[],
    customerExist: number[],
    personDelete: number[],
    personExist: number[],
    vehicleDelete: number[],
    vehicleExist: number[],
}