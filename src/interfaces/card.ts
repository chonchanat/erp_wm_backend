export interface Card {
    card_code_id: number,
    value: string,
    person_id: number,
}

export interface CardType {
    action_by: number,
    card: Card,
}