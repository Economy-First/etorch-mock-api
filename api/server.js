// server.js
import jsonServer from 'json-server'
import { generateMockData } from './generateMockData.js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

// const rewriter = jsonServer.rewriter(require('./routes.json'))

server.use(middlewares)
// server.use(rewriter)

const getIndicators = (source, frequency) => {
    const __filename = fileURLToPath(import.meta.url); // 현재 파일의 경로
    const __dirname = dirname(__filename); // 현재 디렉토리의 경로
    const dbFilePath = resolve(__dirname, 'db.json'); // __dirname 사용
    const dbData = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
    const hasFrequency = {
        M: 'hasMonth',
        Q: 'hasQuarter',
        Y: 'hasYear',
        D: 'hasDay'
    }
    return dbData[source].filter(
        (indicator) => indicator[hasFrequency[frequency]]
    );
};

server.get('/v1/indicators/:origin/:frequency', (req, res) => {
    res.send(
        getIndicators(req.params.origin, req.params.frequency)
    )
})

server.get('/v1/indicators/:origin/code/:code/:frequency', (req, res) => {
    const { origin, code, frequency } = req.params
    const indicator = getIndicators(origin, frequency).find(item => item.code === code)
    const mockData = generateMockData({
        frequency: req.params.frequency,
        from: req.query.from,
        to: req.query.to
    }).map(item => ({
        ...item,
        code,
        origin,
        unit: indicator.unit_en
    }))
    res.send(mockData)
})

// server.get('/v1/indicators/:origin/:code/:frequency/', (req, res) => {
//     res.send(generateMockData(req.params.frequency))
// })

server.use(jsonServer.bodyParser)
server.use(router)
server.listen(4000, () => {
    console.log('JSON Server is running')
})
