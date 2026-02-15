'use client'

import { Toaster as Sonner } from 'sonner'

export default function Toaster() {
    return (
        <Sonner
            position="top-center"
            toastOptions={{
                style: {
                    background: 'white',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                },
                className: 'toast group',
            }}
        />
    )
}
