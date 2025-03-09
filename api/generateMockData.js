import { addDays, addMonths, addYears, startOfQuarter, endOfQuarter, addQuarters, format, startOfYear, endOfYear, startOfMonth, endOfMonth, isSameDay } from 'date-fns'

// 데이터 생성 함수들
export function generateMockData ({ frequency, from, to }) {
  const fromDate = new Date(from)
  let toDate = new Date(to)

  if (isNaN(fromDate) || isNaN(toDate)) throw new Error('Invalid date format')

  if (toDate.getDate() > endOfMonth(toDate).getDate()) toDate = endOfMonth(toDate)

  const generatorMap = {
    A: generateYearlyData,
    Q: generateQuarterlyData,
    M: generateMonthlyData,
    D: generateDailyData
  }

  if (!generatorMap[frequency]) throw new Error('Invalid frequency')

  return generatorMap[frequency](fromDate, toDate)
}

function generateYearlyData (fromDate, toDate) {
  const dataArray = []
  let current = fromDate

  while (startOfYear(current) <= toDate) {
    if (isWithinRange(current, fromDate, toDate, startOfYear, endOfYear)) {
      dataArray.push({
        date: format(current, 'yyyy'),
        value: getRandomValue('A')
      })
    }
    current = addYears(current, 1)
  }
  return dataArray
}

function generateQuarterlyData (fromDate, toDate) {
  const dataArray = []
  let current = fromDate

  while (startOfQuarter(current) <= toDate) {
    if (isWithinRange(current, fromDate, toDate, startOfQuarter, endOfQuarter)) {
      const year = format(current, 'yyyy')
      const quarter = Math.ceil((current.getMonth() + 1) / 3)
      dataArray.push({
        date: `${year}-Q${quarter}`,
        value: getRandomValue('Q')
      })
    }
    current = addQuarters(current, 1)
  }
  return dataArray
}

function generateMonthlyData (fromDate, toDate) {
  const dataArray = []
  let current = fromDate

  while (startOfMonth(current) <= toDate) {
    if (isWithinRange(current, fromDate, toDate, startOfMonth, endOfMonth)) {
      dataArray.push({
        date: format(current, 'yyyy-MM'),
        value: getRandomValue('M')
      })
    }
    current = addMonths(current, 1)
  }
  return dataArray
}

function generateDailyData (fromDate, toDate) {
  const dataArray = []
  let current = fromDate

  while (current <= toDate) {
    dataArray.push({
      date: format(current, 'yyyy-MM-dd'),
      value: getRandomValue('D')
    })
    current = addDays(current, 1)
  }
  return dataArray
}

function isWithinRange (date, fromDate, toDate, startFunc, endFunc) {
  const periodStart = startFunc(date)
  const periodEnd = endFunc(date)
  return (isSameDay(periodStart, fromDate) || periodStart >= fromDate) &&
        (isSameDay(periodEnd, toDate) || periodEnd <= toDate)
}

function getRandomValue (frequency) {
  switch (frequency) {
    case 'A': // Yearly
      return Math.floor(Math.random() * 1001) + 1000
    case 'Q': // Quarterly
      return Math.floor(Math.random() * 401) + 600
    case 'M': // Monthly
      return Math.floor(Math.random() * 21) + 80
    case 'D': // Daily
      return Math.floor(Math.random() * 10) + 90
    default:
      return Math.floor(Math.random() * 1001)
  }
}
