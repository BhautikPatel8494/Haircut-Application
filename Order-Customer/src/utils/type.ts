import { CartProfiles } from "src/schema/customerCart.schema";

export interface SendNotification {
    lat: any,
    lng: any,
    city?: string,
    full_name: string,
    profile: string,
    booking_type: string,
    stylist_level?: string,
    created_at: string,
    cart_profile?: [CartProfiles],
    token?: string,
    type?: string,
    user_id: string,
    stylist_id?: string,
    notification_type: string,
    total_price?: string,
    order_id: string,
    is_custom: boolean,
    message?:string,
}