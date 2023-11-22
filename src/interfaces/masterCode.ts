export interface MasterCode {
    category: string | string[], 
    class: string | string[],
    value?: string
}

export interface MasterCodeType {
    action_by: number,
    masterCode: MasterCode,
}