import React from 'react'

type SignalEducationChartProps = {
  title?: string
  className?: string
}

const SignalEducationChart: React.FC<SignalEducationChartProps> = ({ title = 'Sample chart', className = '' }) => {
  return (
    <div data-testid="signal-education-chart" className={`rounded-md border border-dashed border-gray-200 bg-gray-50 dark:bg-gray-950 p-3 ${className}`} aria-hidden="true">
      <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-2 h-20 w-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded" />
    </div>
  )
}

export default SignalEducationChart
