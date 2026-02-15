export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    role: 'admin' | 'worker'
                    mall_name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    role: 'admin' | 'worker'
                    mall_name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    role?: 'admin' | 'worker'
                    mall_name?: string
                    created_at?: string
                }
            }
            surveys: {
                Row: {
                    id: string
                    title: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            survey_questions: {
                Row: {
                    id: string
                    survey_id: string
                    question: string
                    type: 'text' | 'radio' | 'checkbox'
                    options: Json | null
                    required: boolean
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    survey_id: string
                    question: string
                    type: 'text' | 'radio' | 'checkbox'
                    options?: Json | null
                    required?: boolean
                    order_index: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    survey_id?: string
                    question?: string
                    type?: 'text' | 'radio' | 'checkbox'
                    options?: Json | null
                    required?: boolean
                    order_index?: number
                    created_at?: string
                }
            }
            submissions: {
                Row: {
                    id: string
                    survey_id: string
                    worker_id: string
                    customer_name: string
                    customer_phone: string
                    invoice_number: string
                    invoice_image_url: string
                    customer_image_url: string | null
                    answers: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    survey_id: string
                    worker_id: string
                    customer_name: string
                    customer_phone: string
                    invoice_number: string
                    invoice_image_url: string
                    customer_image_url?: string | null
                    answers: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    survey_id?: string
                    worker_id?: string
                    customer_name?: string
                    customer_phone?: string
                    invoice_number?: string
                    invoice_image_url?: string
                    customer_image_url?: string | null
                    answers?: Json
                    created_at?: string
                }
            }
        }
    }
}
