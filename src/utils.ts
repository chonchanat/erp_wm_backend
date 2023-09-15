export function getDateTime() {
    let date = new Date();
    let utc7date = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return utc7date;
}