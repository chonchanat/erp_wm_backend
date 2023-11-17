export interface UserAccount {
    username: string,
    password: string,
    uid: string,
    person_id: number,
    profile_id: number,
}

export interface UserAccountType {
    action_by: number,
    userAccount: UserAccount
}