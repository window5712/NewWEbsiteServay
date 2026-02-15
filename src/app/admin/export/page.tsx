'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Download } from 'lucide-react'

export default function ExportPage() {
    const [dateFilter, setDateFilter] = useState('all')
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const [surveys, setSurveys] = useState<any[]>([])
    const [filterType, setFilterType] = useState<'all' | 'single'>('all')
    const [selectedSurveyId, setSelectedSurveyId] = useState('')
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const fetchSurveys = async () => {
            const { data, error } = await supabase
                .from('surveys')
                .select('id, title')
                .order('title')

            if (data) {
                setSurveys(data)
            }
        }
        fetchSurveys()
    }, [supabase])

    const handleExport = async () => {
        setError('')
        setSuccess('')
        setIsExporting(true)

        try {
            // Build query parameters
            const params = new URLSearchParams()
            params.append('filter', dateFilter)
            if (filterType === 'single' && selectedSurveyId) {
                params.append('surveyId', selectedSurveyId)
            }

            if (dateFilter === 'custom') {
                if (!customStartDate || !customEndDate) {
                    setError('Please select both start and end dates')
                    setIsExporting(false)
                    return
                }
                params.append('startDate', customStartDate)
                params.append('endDate', customEndDate)
            }

            // Call export API
            const response = await fetch(`/api/export?${params.toString()}`)

            if (!response.ok) {
                throw new Error('Failed to generate export')
            }

            // Download file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `survey-submissions-${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            setSuccess('Export completed successfully!')
        } catch (err: any) {
            setError(err.message || 'Failed to export data')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Export Data</h1>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-2xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Submissions to Excel</h2>

                <div className="space-y-4">
                    <Select
                        label="Date Range"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Time' },
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'Last 7 Days' },
                            { value: 'month', label: 'Last 30 Days' },
                            { value: 'custom', label: 'Custom Range' },
                        ]}
                    />

                    <Select
                        label="Export Mode"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value as 'all' | 'single')
                            setError('')
                            setSuccess('')
                        }}
                        options={[
                            { value: 'all', label: 'All Surveys' },
                            { value: 'single', label: 'Single Survey' },
                        ]}
                    />

                    {filterType === 'single' && (
                        <Select
                            label="Select Survey"
                            value={selectedSurveyId}
                            onChange={(e) => {
                                setSelectedSurveyId(e.target.value)
                                setError('')
                                setSuccess('')
                            }}
                            options={[
                                { value: '', label: 'Choose a survey...' },
                                ...surveys.map(s => ({ value: s.id, label: s.title }))
                            ]}
                        />
                    )}

                    {dateFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Start Date"
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-green-700">
                            {success}
                        </div>
                    )}

                    <Button
                        onClick={handleExport}
                        variant="primary"
                        size="lg"
                        isLoading={isExporting}
                        className="w-full"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Export to Excel
                    </Button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium mb-2">Export includes:</p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Customer name, phone, invoice number</li>
                        <li>Worker name and mall name</li>
                        <li>Survey title and all answers</li>
                        <li>Invoice and customer image URLs</li>
                        <li>Submission date and time</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
