import React from 'react'
import { Circle, CheckCircle, Clock, Zap } from 'lucide-react'

const statusConfig = {
  Live: {
    className: 'badge-live',
    icon: <Zap size={10} className="fill-current" />,
    label: 'Live',
  },
  Active: {
    className: 'badge-active',
    icon: <Circle size={10} className="fill-current" />,
    label: 'Active',
  },
  Upcoming: {
    className: 'badge-upcoming',
    icon: <Clock size={10} />,
    label: 'Upcoming',
  },
  Completed: {
    className: 'badge-completed',
    icon: <CheckCircle size={10} />,
    label: 'Completed',
  },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig['Upcoming']
  return (
    <span className={config.className}>
      {config.icon}
      {config.label}
    </span>
  )
}
