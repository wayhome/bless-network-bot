import axios from 'axios'
import { promises as fs } from 'fs'
import winston from 'winston'
import { extractUserIdFromJwtToken, getIpAddressFromProxyUrl, getProxyAgent, getRandomUserAgent, sleep } from './utils.js'

// Global constants
const BASE_URI = 'https://gateway-run.bls.dev/api/v1'
const PING_INTERVAL = 60000

// Logger configuration function to add an account prefix
function createLogger(accountIdentifier) {
  return winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) =>
        `${timestamp} | [${accountIdentifier}] ${level}: ${message}`
      )
    ),
    transports: [new winston.transports.Console()]
  })
}

// Connection states
const CONNECTION_STATES = {
  CONNECTED: 1,
  DISCONNECTED: 2,
  NONE_CONNECTION: 3
}

class AccountSession {
  constructor(token, nodeId, hardwareId, proxy) {
    try {
      this.userId = extractUserIdFromJwtToken(token)
    } catch (error) {
      throw new Error(`Failed to extract userId from token: ${error.message}`)
    }

    this.token = token
    this.nodeId = nodeId
    this.proxy = proxy
    this.ipAddress = getIpAddressFromProxyUrl(proxy)
    this.hardwareId = hardwareId
    this.retries = 0
    this.lastPingTime = 0
    this.userAgent = getRandomUserAgent()
    const shortNodeId = nodeId.substring(0, 9) + '...' + nodeId.substring(nodeId.length - 4)
    this.logger = createLogger(`nodeId:${shortNodeId}@${this.ipAddress || 'no-proxy'}`)
  }

  async start() {
    try {
      await this.registerNode()
      await this.startSession()
      await this.ping()
      this.startPingLoop()
      this.logger.info(`node ${this.nodeId} started`)
    } catch (error) {
      this.logger.error(`Initialization error: ${error.message}`)
    }
  }

  async registerNode() {

    // try to get node info
    const node = await this.getNode()

    if (node) {
      this.logger.info(`Node ${this.nodeId} already registered`)
      return
    }

    const response = await this.performRequest('post', `${BASE_URI}/nodes/${this.nodeId}`, {
      ipAddress: this.ipAddress,
      hardwareId: this.hardwareId
    })

    this.logger.info(`Register node response: ${JSON.stringify(response?.data)}`)
  }

  async getNode() {
    const response = await this.performRequest('get', `${BASE_URI}/nodes/${this.nodeId}`, {
      ipAddress: this.ipAddress,
      hardwareId: this.hardwareId
    })

    this.logger.info(`Register node response: ${JSON.stringify(response?.data)}`)
  }

  async startSession() {
    const response = await this.performRequest('post', `${BASE_URI}/nodes/${this.nodeId}/start-session`)

    this.logger.info(`Start session response: ${JSON.stringify(response?.data)}`)
  }

  async performRequest(method, url, data, maxRetries = 3) {
    const headers = {
      Authorization: `Bearer ${this.token}`,
      'User-Agent': this.userAgent,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/json',
      'Origin': 'chrome-extension://pljbjcehnhcnofmkdbjolghdcjnmekia',
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        let options = {
          headers
        }

        if (this.proxy) {
          const agent = await getProxyAgent(this.proxy)
          this.logger.info(`Using proxy ${this.proxy} for request to ${url}`)
          options.httpAgent = agent
          options.httpsAgent = agent
        }

        let response = null

        if (method === 'post') {
          response = await axios.post(url, data || {}, options)
        } else if (method === 'get') {
          response = await axios.get(url, options)
        }

        if (!response) {
          this.logger.error(`API call failed to ${url} for proxy ${this.ipAddress}, empty response`)
          return null
        }

        this.logger.info(`response: status: ${response.status}(${response.statusText}), body: ${JSON.stringify(response?.data)}`)
        return response
      } catch (error) {
        if (error.response) {
          this.logger.error(`API call failed to ${url} for proxy ${this.ipAddress}: ${error.response.status}(${error.response.statusText})`)
        }

        this.logger.error(`API call failed to ${url} for proxy ${this.ipAddress}: ${error.message}`)
        if (error.response && error.response.status === 403) return null
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      } finally {
        this.logger.info(`Request to ${url} completed`)
      }
    }

    this.logger.error(`API call failed to ${url} after ${maxRetries} attempts for proxy ${this.ipAddress}`)
    return null
  }

  startPingLoop() {
    const interval = setInterval(async () => {
      await this.ping()
    }, PING_INTERVAL)

    this.logger.info(`Ping loop started with interval ${PING_INTERVAL}ms`)

    process.on('SIGINT', () => clearInterval(interval))
  }

  async ping() {
    const currentTime = Date.now()

    if (currentTime - this.lastPingTime < PING_INTERVAL) {
      this.logger.info(`Skipping ping for account ${this.userId} as interval has not elapsed yet`)
      return
    }

    this.lastPingTime = currentTime

    try {
      const response = await this.performRequest('post', `${BASE_URI}/nodes/${this.nodeId}/ping`)

      if (!response) {
        this.logger.error(`Ping failed for proxy ${this.ipAddress}`)
        this.handlePingFail(this.proxy, response)
        return
      }

      const info = ` NodeId: ${this.nodeId}, proxy: ${this.ipAddress}`

      if (!response.data.status) {
        this.logger.info(`first time ping done: ${info}`)
      } else if (response.data.status.toLowerCase() === 'ok') {
        this.logger.info(`ping success: ${info}`)
      } else {
        this.logger.error(`ping failed: ${info}`)
      }
    } catch (error) {
      this.logger.error(`Ping failed for proxy ${this.ipAddress}: ${error.message}`)
      this.handlePingFail(proxy, null)
    }
  }

  handlePingFail(proxy, response) {
    this.retries++
    if (response?.code === 403) {
      this.handleLogout(proxy)
    } else if (this.retries >= 2) {
      this.statusConnect = CONNECTION_STATES.DISCONNECTED
    }
  }

  handleLogout(proxy) {
    this.statusConnect = CONNECTION_STATES.NONE_CONNECTION
    this.logger.info(`Logged out and cleared session info for proxy ${proxy}`)
  }
}

async function loadNodes() {
  try {
    // 结构： userToken|nodeId:hardwareId|proxy
    const lines = await fs.readFile('nodes.txt', 'utf-8')
    // 移除空行和空格，引号
    return lines.split('\n').filter(Boolean).map(token => token.trim().replace(/['"]+/g, '')).map(token => {
      const [userToken, nodeIdHardwareId, proxy] = token.split('|')
      const [nodeId, hardwareId] = nodeIdHardwareId.split(':')
      return { userToken, nodeId, hardwareId, proxy }
    })
  } catch (error) {
    console.log(`Failed to load tokens: ${error.message}`)
    throw error
  }
}

// Main function
async function main() {
  console.log(`
------------------------------------------------------------
|           Bless bot by @overtrue                         |
|     Telegram: https://t.me/+ntyApQYvrBowZTc1             |
| GitHub: https://github.com/web3bothub/bless-network-bot  |
------------------------------------------------------------
`)
  console.log('Starting program...')

  await sleep(3000)

  try {
    const nodes = await loadNodes()

    if (nodes.length === 0) {
      console.error('No nodes found in nodes.txt')
      return
    }

    console.log(`Loaded ${nodes.length} nodes`)

    const sessions = nodes.map(async ({ userToken, nodeId, hardwareId, proxy }) => {
      const session = new AccountSession(userToken, nodeId, hardwareId, proxy)
      await sleep(10000)
      return session.start()
    })

    await Promise.allSettled(sessions)

    console.log('All sessions started, you can view your all nodes status in https://bless.network/dashboard/nodes')
  } catch (error) {
    console.error(`Program terminated: ${error} `)
  }
}

// SIGINT
process.on('SIGINT', () => {
  console.log('Caught interrupt signal')
  process.exit()
})

main().catch(error => {
  console.error(`Fatal error: ${error} `)
})
