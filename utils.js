import axios from "axios"
import { HttpsProxyAgent } from "https-proxy-agent"
import jwt from "jsonwebtoken"
import { SocksProxyAgent } from "socks-proxy-agent"

export const extractUserIdFromJwtToken = (token) => {
  try {
    // 使用 jwt.decode 解码 token
    const decoded = jwt.decode(token)
    if (decoded && decoded.userId) {
      return decoded.userId
    } else {
      throw new Error('userId not found in token')
    }
  } catch (error) {
    console.error('Error decoding token:', error.message)
    return null
  }
}

export const getRandomUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.18 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  ]

  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getProxyAgent = async (proxy) => {
  if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
    return new HttpsProxyAgent(proxy)
  } else if (proxy.startsWith('socks://') || proxy.startsWith('socks5://')) {
    return new SocksProxyAgent(proxy)
  }

  throw new Error(`Unsupported proxy ${proxy}`)
}

export const getRandomInt = (min, max) => {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled) // The maximum is exclusive and the minimum is inclusive
}

export const isValidIp = (ip) => {
  const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/
  return ipv4Pattern.test(ip)
}


export const getIpAddressFromProxyUrl = (proxyUrl) => {
  try {
    const url = new URL(proxyUrl)
    const ipAddress = url.hostname

    if (!isValidIp(ipAddress)) {
      throw new Error(`Invalid IP address extracted: ${ipAddress}`)
    }

    return ipAddress
  } catch (error) {
    console.error('Failed to extract IP from proxy URL:', error.message)
    return null
  }
}

export async function getIpAddress(proxy) {
  let options = {}

  if (proxy) {
    const agent = await getProxyAgent(proxy)
    options.httpAgent = agent
    options.httpsAgent = agent
  }

  return await axios.get('https://myip.ipip.net', options)
    .then(response => response.data)
}
