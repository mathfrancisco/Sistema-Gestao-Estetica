// lib/supabase/types.ts
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Enums
export type ClientStatus = 'active' | 'inactive' | 'blocked'
export type ClientSegment = 'vip' | 'regular' | 'new' | 'at_risk' | 'lost'
export type SegmentType = 'value' | 'frequency' | 'recency' | 'behavior'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type PaymentMethod = 'cash' | 'pix' | 'debit' | 'credit' | 'installment'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type StockMovement = 'in' | 'out' | 'adjustment' | 'expired' | 'loss'
export type ProfitCategory = 'pro_labore' | 'equipment_reserve' | 'emergency_reserve' | 'investment'
export type GoalType = 'revenue' | 'profit' | 'clients' | 'appointments' | 'procedures'
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

// Novos tipos para campanhas
export type CampaignType = 'email' | 'sms' | 'whatsapp' | 'calendar' | 'birthday'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
export type CampaignTrigger = 'manual' | 'automatic' | 'scheduled' | 'event_based'
export type CampaignTargetType = 'all_clients' | 'segment' | 'custom_list' | 'individual'

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    avatar_url: string;
                    full_name: string;
                    id: string
                    email: string
                    google_calendar_id: string | null
                    google_access_token: string | null
                    google_refresh_token: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    google_calendar_id?: string | null
                    google_access_token?: string | null
                    google_refresh_token?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    google_calendar_id?: string | null
                    google_access_token?: string | null
                    google_refresh_token?: string | null
                    updated_at?: string
                }
            }
            business_profile: {
                Row: {
                    id: string
                    user_id: string
                    business_name: string
                    cnpj: string | null
                    phone: string | null
                    address: Json | null
                    business_hours: Json | null
                    google_calendar_settings: Json | null
                    settings: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_name: string
                    cnpj?: string | null
                    phone?: string | null
                    address?: Json | null
                    business_hours?: Json | null
                    google_calendar_settings?: Json | null
                    settings?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_name?: string
                    cnpj?: string | null
                    phone?: string | null
                    address?: Json | null
                    business_hours?: Json | null
                    google_calendar_settings?: Json | null
                    settings?: Json | null
                }
            }
            clients: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    cpf: string | null
                    birthday: string | null
                    address: Json | null
                    preferences: string | null
                    observations: string | null
                    status: ClientStatus
                    segment: ClientSegment | null
                    first_visit: string | null
                    last_visit: string | null
                    total_spent: number
                    total_visits: number
                    ltv_score: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    cpf?: string | null
                    birthday?: string | null
                    address?: Json | null
                    preferences?: string | null
                    observations?: string | null
                    status?: ClientStatus
                    segment?: ClientSegment | null
                    first_visit?: string | null
                    last_visit?: string | null
                    total_spent?: number
                    total_visits?: number
                    ltv_score?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    cpf?: string | null
                    birthday?: string | null
                    address?: Json | null
                    preferences?: string | null
                    observations?: string | null
                    status?: ClientStatus
                    segment?: ClientSegment | null
                    first_visit?: string | null
                    last_visit?: string | null
                    total_spent?: number
                    total_visits?: number
                    ltv_score?: number | null
                    updated_at?: string
                }
            }
            procedure_categories: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    color: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    color?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    color?: string | null
                    is_active?: boolean
                }
            }
            procedures: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string | null
                    name: string
                    description: string | null
                    price: number
                    cost: number
                    duration_minutes: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category_id?: string | null
                    name: string
                    description?: string | null
                    price: number
                    cost?: number
                    duration_minutes?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_id?: string | null
                    name?: string
                    description?: string | null
                    price?: number
                    cost?: number
                    duration_minutes?: number
                    is_active?: boolean
                }
            }
            appointments: {
                Row: {
                    id: string
                    user_id: string
                    client_id: string
                    procedure_id: string
                    google_event_id: string | null
                    scheduled_datetime: string
                    duration_minutes: number | null
                    status: AppointmentStatus
                    notes: string | null
                    google_meet_link: string | null
                    calendar_synced: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    client_id: string
                    procedure_id: string
                    google_event_id?: string | null
                    scheduled_datetime: string
                    duration_minutes?: number | null
                    status?: AppointmentStatus
                    notes?: string | null
                    google_meet_link?: string | null
                    calendar_synced?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    client_id?: string
                    procedure_id?: string
                    google_event_id?: string | null
                    scheduled_datetime?: string
                    duration_minutes?: number | null
                    status?: AppointmentStatus
                    notes?: string | null
                    google_meet_link?: string | null
                    calendar_synced?: boolean
                    updated_at?: string
                }
            }
            attendances: {
                Row: {
                    id: string
                    user_id: string
                    appointment_id: string | null
                    client_id: string
                    procedure_id: string
                    date: string
                    value: number
                    discount: number
                    product_cost: number
                    payment_method: PaymentMethod | null
                    payment_status: PaymentStatus
                    observations: string | null
                    rating: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    appointment_id?: string | null
                    client_id: string
                    procedure_id: string
                    date: string
                    value: number
                    discount?: number
                    product_cost?: number
                    payment_method?: PaymentMethod | null
                    payment_status?: PaymentStatus
                    observations?: string | null
                    rating?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    appointment_id?: string | null
                    client_id?: string
                    procedure_id?: string
                    date?: string
                    value?: number
                    discount?: number
                    product_cost?: number
                    payment_method?: PaymentMethod | null
                    payment_status?: PaymentStatus
                    observations?: string | null
                    rating?: number | null
                }
            }
            products: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    sku: string | null
                    category: string | null
                    unit: string
                    cost_price: number
                    current_stock: number
                    min_stock: number
                    expiry_date: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    sku?: string | null
                    category?: string | null
                    unit?: string
                    cost_price: number
                    current_stock?: number
                    min_stock?: number
                    expiry_date?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    sku?: string | null
                    category?: string | null
                    unit?: string
                    cost_price?: number
                    current_stock?: number
                    min_stock?: number
                    expiry_date?: string | null
                    is_active?: boolean
                }
            }
            stock_movements: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    movement_type: StockMovement
                    quantity: number
                    unit_cost: number | null
                    reference_id: string | null
                    reference_type: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    movement_type: StockMovement
                    quantity: number
                    unit_cost?: number | null
                    reference_id?: string | null
                    reference_type?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    movement_type?: StockMovement
                    quantity?: number
                    unit_cost?: number | null
                    reference_id?: string | null
                    reference_type?: string | null
                    notes?: string | null
                }
            }
            profit_distribution_config: {
                Row: {
                    id: string
                    user_id: string
                    category: ProfitCategory
                    percentage: number
                    description: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category: ProfitCategory
                    percentage: number
                    description?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category?: ProfitCategory
                    percentage?: number
                    description?: string | null
                    is_active?: boolean
                    updated_at?: string
                }
            }
            profit_distributions: {
                Row: {
                    id: string
                    user_id: string
                    period_month: number
                    period_year: number
                    total_revenue: number | null
                    total_costs: number | null
                    total_profit: number | null
                    pro_labore_amount: number | null
                    equipment_reserve_amount: number | null
                    emergency_reserve_amount: number | null
                    investment_amount: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    period_month: number
                    period_year: number
                    total_revenue?: number | null
                    total_costs?: number | null
                    total_profit?: number | null
                    pro_labore_amount?: number | null
                    equipment_reserve_amount?: number | null
                    emergency_reserve_amount?: number | null
                    investment_amount?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    period_month?: number
                    period_year?: number
                    total_revenue?: number | null
                    total_costs?: number | null
                    total_profit?: number | null
                    pro_labore_amount?: number | null
                    equipment_reserve_amount?: number | null
                    emergency_reserve_amount?: number | null
                    investment_amount?: number | null
                }
            }
            calendar_sync_settings: {
                Row: {
                    id: string
                    user_id: string
                    calendar_id: string
                    default_color: string | null
                    auto_create_events: boolean
                    send_invites: boolean
                    remind_minutes_before: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    calendar_id: string
                    default_color?: string | null
                    auto_create_events?: boolean
                    send_invites?: boolean
                    remind_minutes_before?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    calendar_id?: string
                    default_color?: string | null
                    auto_create_events?: boolean
                    send_invites?: boolean
                    remind_minutes_before?: number
                    updated_at?: string
                }
            }
            // ========== NOVAS TABELAS PARA CAMPANHAS ==========
            campaigns: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    type: CampaignType
                    status: CampaignStatus
                    trigger_type: CampaignTrigger
                    target_type: CampaignTargetType
                    target_segment: ClientSegment | null
                    target_criteria: Json | null
                    content: Json | null
                    template_id: string | null
                    scheduled_at: string | null
                    started_at: string | null
                    completed_at: string | null
                    target_count: number
                    sent_count: number
                    delivered_count: number
                    opened_count: number
                    clicked_count: number
                    converted_count: number
                    revenue_generated: number
                    cost: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    type: CampaignType
                    status?: CampaignStatus
                    trigger_type?: CampaignTrigger
                    target_type: CampaignTargetType
                    target_segment?: ClientSegment | null
                    target_criteria?: Json | null
                    content?: Json | null
                    template_id?: string | null
                    scheduled_at?: string | null
                    started_at?: string | null
                    completed_at?: string | null
                    target_count?: number
                    sent_count?: number
                    delivered_count?: number
                    opened_count?: number
                    clicked_count?: number
                    converted_count?: number
                    revenue_generated?: number
                    cost?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    type?: CampaignType
                    status?: CampaignStatus
                    trigger_type?: CampaignTrigger
                    target_type?: CampaignTargetType
                    target_segment?: ClientSegment | null
                    target_criteria?: Json | null
                    content?: Json | null
                    template_id?: string | null
                    scheduled_at?: string | null
                    started_at?: string | null
                    completed_at?: string | null
                    target_count?: number
                    sent_count?: number
                    delivered_count?: number
                    opened_count?: number
                    clicked_count?: number
                    converted_count?: number
                    revenue_generated?: number
                    cost?: number
                    is_active?: boolean
                    updated_at?: string
                }
            }
            campaign_recipients: {
                Row: {
                    id: string
                    campaign_id: string
                    client_id: string
                    contact_info: Json | null
                    sent_at: string | null
                    delivered_at: string | null
                    opened_at: string | null
                    clicked_at: string | null
                    converted_at: string | null
                    bounce_reason: string | null
                    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'bounced' | 'failed'
                    created_at: string
                }
                Insert: {
                    id?: string
                    campaign_id: string
                    client_id: string
                    contact_info?: Json | null
                    sent_at?: string | null
                    delivered_at?: string | null
                    opened_at?: string | null
                    clicked_at?: string | null
                    converted_at?: string | null
                    bounce_reason?: string | null
                    status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'bounced' | 'failed'
                    created_at?: string
                }
                Update: {
                    id?: string
                    campaign_id?: string
                    client_id?: string
                    contact_info?: Json | null
                    sent_at?: string | null
                    delivered_at?: string | null
                    opened_at?: string | null
                    clicked_at?: string | null
                    converted_at?: string | null
                    bounce_reason?: string | null
                    status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'bounced' | 'failed'
                }
            }
            campaign_templates: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    type: CampaignType
                    content: Json
                    variables: Json | null
                    is_default: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    type: CampaignType
                    content: Json
                    variables?: Json | null
                    is_default?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    type?: CampaignType
                    content?: Json
                    variables?: Json | null
                    is_default?: boolean
                    is_active?: boolean
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            client_status_enum: ClientStatus
            client_segment_enum: ClientSegment
            segment_type_enum: SegmentType
            appointment_status_enum: AppointmentStatus
            payment_method_enum: PaymentMethod
            payment_status_enum: PaymentStatus
            stock_movement_enum: StockMovement
            profit_category_enum: ProfitCategory
            goal_type_enum: GoalType
            period_type_enum: PeriodType
            campaign_type_enum: CampaignType
            campaign_status_enum: CampaignStatus
            campaign_trigger_enum: CampaignTrigger
            campaign_target_type_enum: CampaignTargetType
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}