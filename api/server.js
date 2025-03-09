import jsonServer from 'json-server'
import { generateMockData } from './generateMockData.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const server = jsonServer.create()
const router = jsonServer.router(join(dirname(fileURLToPath(import.meta.url)), '../db.json'))
const middlewares = jsonServer.defaults()

// 기본 미들웨어 설정
server.use(middlewares)
server.use(jsonServer.bodyParser)

// 1. 출처(Origin) 관련 API
server.get('/api/v1/origins', (req, res) => {
  const origins = router.db.get('origins').value()
  res.jsonp({
    success: true,
    data: origins
  })
})

// 2.1 특정 출처의 모든 지표 목록 조회
server.get('/api/v1/origins/:origin/indicators', (req, res) => {
  const origin = req.params.origin
  const frequency = req.query.frequency
  let indicators = router.db.get('indicators')
    .filter({ origin })
    .map(({ code, name, unit, frequencies }) => ({ code, name, unit, frequencies }))
    .value()
  if (frequency) {
    indicators = indicators.filter(indicator =>
      indicator.frequencies.includes(frequency)
    )
  }
  if (indicators.length === 0) {
    return res.status(404).jsonp({
      success: false,
      error: {
        code: 'ORIGIN_NOT_FOUND',
        message: `Origin '${origin}' not found`
      }
    })
  }

  res.jsonp({
    success: true,
    data: indicators
  })
})

// 2.2 특정 출처의 특정 지표 상세 정보 조회
server.get('/api/v1/origins/:origin/indicators/:code', (req, res) => {
  const { origin, code } = req.params
  const indicator = router.db.get('indicators')
    .find({ origin, code })
    .value()

  if (!indicator) {
    return res.status(404).jsonp({
      success: false,
      error: {
        code: 'INDICATOR_NOT_FOUND',
        message: `Indicator not found with origin: ${origin} and code: ${code}`
      }
    })
  }

  // 데이터 조회주기 정보 확장
  const frequencyDetails = indicator.frequencies.map(freq => {
    const frequency = router.db.get('frequencies')
      .find({ code: freq })
      .value()
    return {
      code: freq,
      name: frequency ? frequency.name : freq
    }
  })

  const result = {
    ...indicator,
    frequencies: frequencyDetails
  }

  res.jsonp({
    success: true,
    data: result
  })
})

// 2.3 모든 출처의 모든 지표 목록 조회
server.get('/api/v1/indicators', (req, res) => {
  const frequency = req.query.frequency
  let indicators = router.db.get('indicators').value()

  // 데이터 조회주기 필터링이 있는 경우
  if (frequency) {
    indicators = indicators.filter(indicator =>
      indicator.frequencies.includes(frequency)
    )
  }

  res.jsonp({
    success: true,
    data: indicators
  })
})

// 2.4 특정 코드의 모든 출처 지표 조회
server.get('/api/v1/indicators/:code', (req, res) => {
  const code = req.params.code
  const indicators = router.db.get('indicators')
    .filter({ code })
    .value()

  if (indicators.length === 0) {
    return res.status(404).jsonp({
      success: false,
      error: {
        code: 'INDICATOR_NOT_FOUND',
        message: `No indicators found with code: ${code}`
      }
    })
  }

  res.jsonp({
    success: true,
    data: indicators
  })
})

// 3.1 데이터 조회주기 목록 조회
server.get('/api/v1/frequencies', (req, res) => {
  const frequencies = router.db.get('frequencies').value()

  res.jsonp({
    success: true,
    data: frequencies
  })
})

// 3.2 특정 출처의 특정 지표 데이터 조회
server.get('/api/v1/origins/:origin/data/:code', (req, res) => {
  const { origin, code } = req.params
  const { frequency, start_date: startDae, end_date: endDate } = req.query

  // 지표 확인
  const indicator = router.db.get('indicators')
    .find({ origin, code })
    .value()

  if (!indicator) {
    return res.status(404).jsonp({
      success: false,
      error: {
        code: 'INDICATOR_NOT_FOUND',
        message: `Indicator not found with origin: ${origin} and code: ${code}`
      }
    })
  }

  // 데이터 조회주기 지원 확인
  if (frequency && !indicator.frequencies.includes(frequency)) {
    return res.status(400).jsonp({
      success: false,
      error: {
        code: 'INVALID_FREQUENCY',
        message: `The indicator does not support the requested frequency (${frequency}). Supported frequencies: [${indicator.frequencies.join(', ')}]`
      }
    })
  }

  // 데이터 생성
  try {
    const from = startDae || '2020-01-01'
    const to = endDate || new Date().toISOString().split('T')[0]
    const usedFrequency = frequency || indicator.frequencies[0]

    const timeSeries = generateMockData({
      frequency: usedFrequency,
      from,
      to
    })

    res.jsonp({
      success: true,
      data: {
        origin,
        code,
        name: indicator.name,
        unit: indicator.unit,
        frequency: usedFrequency,
        time_series: timeSeries
      }
    })
  } catch (error) {
    res.status(400).jsonp({
      success: false,
      error: {
        code: 'DATA_GENERATION_ERROR',
        message: error.message
      }
    })
  }
})

// 3.3 다중 지표 데이터 조회
server.get('/api/v1/data', (req, res) => {
  const { indicators, frequency, start_date: startDate, end_date: endDate } = req.query

  if (!indicators) {
    return res.status(400).jsonp({
      success: false,
      error: {
        code: 'MISSING_INDICATORS',
        message: 'indicators parameter is required (format: origin:code,origin:code)'
      }
    })
  }

  const indicatorList = indicators.split(',')
  const result = []

  for (const item of indicatorList) {
    const [origin, code] = item.split(':')

    if (!origin || !code) {
      return res.status(400).jsonp({
        success: false,
        error: {
          code: 'INVALID_INDICATOR_FORMAT',
          message: `Invalid indicator format: ${item}. Expected format: origin:code`
        }
      })
    }

    const indicator = router.db.get('indicators')
      .find({ origin, code })
      .value()

    if (!indicator) {
      return res.status(404).jsonp({
        success: false,
        error: {
          code: 'INDICATOR_NOT_FOUND',
          message: `Indicator not found with origin: ${origin} and code: ${code}`
        }
      })
    }

    const supportedFrequencies = indicator.frequencies
    const usedFrequency = frequency || supportedFrequencies[0]

    if (!supportedFrequencies.includes(usedFrequency)) {
      return res.status(400).jsonp({
        success: false,
        error: {
          code: 'INVALID_FREQUENCY',
          message: `Indicator ${origin}:${code} does not support frequency (${usedFrequency}). Supported: [${supportedFrequencies.join(', ')}]`
        }
      })
    }

    try {
      const from = startDate || '2020-01-01'
      const to = endDate || new Date().toISOString().split('T')[0]

      const timeSeries = generateMockData({
        frequency: usedFrequency,
        from,
        to
      })

      result.push({
        origin,
        code,
        name: indicator.name,
        unit: indicator.unit,
        frequency: usedFrequency,
        time_series: timeSeries
      })
    } catch (error) {
      return res.status(400).jsonp({
        success: false,
        error: {
          code: 'DATA_GENERATION_ERROR',
          message: error.message
        }
      })
    }
  }

  res.jsonp({
    success: true,
    data: result
  })
})

// 모의 API 서버 시작
const PORT = 4000
server.use('/api/v1', router)
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`)
  console.log(`API root: http://localhost:${PORT}/api/v1`)
})
