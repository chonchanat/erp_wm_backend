export interface UserAccount {
    username: string,
    password: string,
    uid: string,
    person_id: number,
    profile_id: number,
}

export interface UserAccountType {
    create_by?: number,
    update_by?: number,
    userAccount: UserAccount
}