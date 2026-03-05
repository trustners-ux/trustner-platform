import dayjs from 'dayjs'

export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '₹0'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '₹0'

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num).replace('₹', '₹ ')
}

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export const formatDate = (date, format = 'DD MMM YYYY') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  return dayjs(date).format('DD MMM YYYY HH:mm')
}

export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'

  return `${num.toFixed(decimals)}%`
}

export const formatChange = (value) => {
  if (value === null || value === undefined) return '0%'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'

  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export const shortNumber = (value) => {
  if (!value) return '0'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + 'L'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toFixed(0)
}
