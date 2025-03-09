# 경제지표 대시보드 RESTful API 설계

## 1. 리소스 구조 설계

### 기본 리소스 계층
- `/origins` - 데이터 출처 목록 (KOSIS, ECOS, OECD)
- `/origins/{origin}/indicators` - 특정 출처의 지표 목록
- `/origins/{origin}/indicators/{code}` - 특정 출처의 특정 지표 상세 정보
- `/data` - 지표 데이터 조회 (출처와 코드 기반)

## 2. API 엔드포인트 상세

### 2.1 출처 관련 API

#### 모든 출처 목록 조회
```
GET /api/v1/origins
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "code": "kosis",
      "name": "Statistics Korea"
    },
    {
      "code": "ecos",
      "name": "Bank of Korea"
    },
    {
      "code": "oecd",
      "name": "OECD"
    }
  ]
}
```

### 2.2 지표 정보 API

#### 특정 출처의 모든 지표 목록 조회
```
GET /api/v1/origins/{origin}/indicators
```

**쿼리 파라미터:**
- `frequency`: 조회 주기 (D, M, Q, A)

**예시:** `GET /api/v1/origins/kosis/indicators`

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "code": "CCI",
      "name": "Composite Coincident Index",
      "unit": "2020=100",
      "frequencies": ["M"]
    },
    {
      "code": "KOSPI",
      "name": "Korea Composite Stock Price Index",
      "unit": "Index",
      "frequencies": ["M", "D"]
    }
  ]
}
```

#### 특정 출처의 특정 지표 상세 정보 조회
```
GET /api/v1/origins/{origin}/indicators/{code}
```

**예시:** `GET /api/v1/origins/kosis/indicators/CCI`

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "code": "CCI",
    "name": "Composite Coincident Index",
    "description": "Composite Coincident Index published by Statistics Korea.",
    "unit": "2020=100",
    "frequencies": [
      "M"
    ]
  }
}
```

#### 모든 출처의 모든 지표 목록 조회
```
GET /api/v1/indicators
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "origin": "kosis",
      "code": "CCI",
      "name": "Composite Coincident Index",
      "unit": "2020=100",
      "frequencies": ["M"]
    },
    {
      "origin": "oecd",
      "code": "CLI_OECD",
      "name": "Composite leading indicators",
      "unit": "2020=100",
      "frequencies": ["M"]
    },
    {
      "origin": "ecos",
      "code": "BOND_YIELD_1YR",
      "name": "Government Bond 1Y Rate",
      "unit": "Annual Percentage Rate (APR)",
      "frequencies": ["D", "M"]
    }
  ]
}
```

#### 특정 코드의 모든 출처 지표 조회 (코드가 중복되는 경우)
```
GET /api/v1/indicators/{code}
```

**예시:** `GET /api/v1/indicators/GDP_RGR` (KOSIS와 ECOS 양쪽에 존재하는 코드)

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "origin": "kosis",
      "code": "GDP_RGR",
      "name": "GDP growth rate",
      "unit": "%",
      "frequencies": ["A"]
    },
    {
      "origin": "ecos",
      "code": "GDP_RGR",
      "name": "GDP growth rate",
      "unit": "%",
      "frequencies": ["A"]
    }
  ]
}
```

#### 데이터 조회주기별 지표 목록 조회
```
GET /api/v1/indicators?frequency={frequency}
```

**예시:** `GET /api/v1/indicators?frequency=Q`

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "origin": "kosis",
      "code": "RGDP_QoQ_SA",
      "name": "GDP growth rate (real, seasonally adjusted, QoQ)",
      "unit": "QoQ (%)"
    },
    {
      "origin": "ecos",
      "code": "NGDP_SA",
      "name": "Gross domestic product (seasonally adjusted, nominal)",
      "unit": "Bil.Won"
    }
  ]
}
```

### 2.3 지표 데이터 API

#### 특정 출처의 특정 지표 데이터 조회
```
GET /api/v1/origins/{origin}/data/{code}
```

**쿼리 파라미터:**
- `frequency`: 조회 주기 (D, M, Q, A)
- `startDate`: 시작일 (YYYYMMDD)
- `endDate`: 종료일 (YYYYMMDD)

**예시:** `GET /api/v1/origins/kosis/data/CCI?frequency=M&startDate=2023-01-01&endDate=2023-12-31`

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "origin": "kosis",
    "code": "CCI",
    "name": "Composite Coincident Index",
    "unit": "2020=100",
    "frequency": "M",
    "time_series": [
      { "date": "2023-01", "value": 98.6 },
      { "date": "2023-02", "value": 98.8 },
      { "date": "2023-03", "value": 99.1 }
    ]
  }
}
```

#### 다중 지표 데이터 조회 (출처와 코드 조합)
```
GET /api/v1/data
```

**쿼리 파라미터:**
- `indicators`: 출처와 코드를 조합한 지표 식별자 (콤마로 구분)
- `frequency`: 조회 주기 (D, M, Q, A)
- `startDate`: 시작일 (YYYYMMDD)
- `endDate`: 종료일 (YYYYMMDD)

**예시:**
```
GET /api/v1/data?indicators=kosis:CCI,oecd:CLI_OECD,ecos:BOND_YIELD_1YR&frequency=M&startDate=2023-01-01&endDate=2023-12-31
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "origin": "kosis",
      "code": "CCI",
      "name": "Composite Coincident Index",
      "unit": "2020=100",
      "frequency": "M",
      "time_series": [
        { "date": "2023-01", "value": 98.6 },
        { "date": "2023-02", "value": 98.8 }
      ]
    },
    {
      "origin": "oecd",
      "code": "CLI_OECD",
      "name": "Composite leading indicators",
      "unit": "2020=100",
      "frequency": "M",
      "time_series": [
        { "date": "2023-01", "value": 99.97 },
        { "date": "2023-02", "value": 100.13 }
      ]
    },
    {
      "origin": "ecos",
      "code": "BOND_YIELD_1YR",
      "name": "Government Bond 1Y Rate",
      "unit": "Annual Percentage Rate (APR)",
      "frequency": "M",
      "time_series": [
        { "date": "2023-01", "value": 3.42 },
        { "date": "2023-02", "value": 3.38 }
      ]
    }
  ]
}
```

### 2.4 주파수 관련 API

#### 주파수 목록 조회
```
GET /api/v1/frequencies
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "code": "D",
      "name": "Daily"
    },
    {
      "code": "M",
      "name": "Monthly"
    },
    {
      "code": "Q",
      "name": "Quarterly"
    },
    {
      "code": "A",
      "name": "Annual"
    }
  ]
}
```

### 2.5 관리자용 API

#### 데이터 업데이트 요청
```
POST /api/v1/admin/origins/{origin}/update
```

**요청 본문:**
```json
{
  "codes": ["CCI", "KOSPI"] // 특정 지표만 업데이트하려면 코드 목록 제공, 없으면 전체 업데이트
}
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Update completed successfully",
    "updated_count": 2,
    "updated_indicators": ["CCI", "KOSPI"]
  }
}
```

#### 신규 지표 등록
```
POST /api/v1/admin/origins/{origin}/indicators
```

**요청 본문:**
```json
{
  "code": "NEW_INDICATOR",
  "name": "New Economic Indicator",
  "name_ko": "새 경제지표", // 참조용으로 데이터베이스 저장
  "description": "Description of the new economic indicator",
  "description_ko": "새로운 경제지표에 대한 설명", // 참조용으로 데이터베이스 저장
  "unit": "%",
  "unit_ko": "%", // 참조용으로 데이터베이스 저장
  "frequencies": ["M", "Q", "A"]
}
```

**성공 응답 (201 Created):**
```json
{
  "success": true,
  "data": {
    "origin": "kosis",
    "code": "NEW_INDICATOR",
    "name": "New Economic Indicator",
    "message": "Indicator successfully created"
  }
}
```

#### 지표 정보 수정
```
PUT /api/v1/admin/origins/{origin}/indicators/{code}
```

**요청 본문:**
```json
{
  "name": "Updated Indicator Name",
  "name_ko": "수정된 지표 이름", // 참조용으로 데이터베이스 저장
  "description": "Updated description text",
  "description_ko": "수정된 설명", // 참조용으로 데이터베이스 저장
  "unit": "Updated Unit",
  "unit_ko": "수정된 단위" // 참조용으로 데이터베이스 저장
}
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "origin": "kosis", 
    "code": "CCI",
    "name": "Updated Indicator Name",
    "message": "Indicator successfully updated"
  }
}
```

#### 지표 삭제
```
DELETE /api/v1/admin/origins/{origin}/indicators/{code}
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Indicator successfully deleted",
    "origin": "kosis",
    "code": "CCI"
  }
}
```

## 3. 오류 응답 형식

### 3.1 리소스를 찾을 수 없음 (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "INDICATOR_NOT_FOUND",
    "message": "Requested indicator not found with origin: kosis and code: XYZ"
  }
}
```

### 3.2 잘못된 요청 (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FREQUENCY",
    "message": "The indicator does not support the requested frequency (M). Supported frequencies: [Q, A]"
  }
}
```

### 3.3 서버 내부 오류 (500 Internal Server Error)
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "An error occurred while querying the database"
  }
}
```

### 3.4 서비스 사용 불가 (503 Service Unavailable)
```json
{
  "success": false,
  "error": {
    "code": "API_UNAVAILABLE",
    "message": "External data source (OECD) is currently unavailable"
  }
}
```
