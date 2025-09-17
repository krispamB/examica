import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL

    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set')
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    })

    redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    redis.on('connect', () => {
      console.log('Redis connected successfully')
    })

    redis.on('ready', () => {
      console.log('Redis is ready to receive commands')
    })

    redis.on('close', () => {
      console.log('Redis connection closed')
    })
  }

  return redis
}

export function closeRedisConnection(): Promise<'OK'> {
  if (redis) {
    const client = redis
    redis = null
    return client.quit()
  }
  return Promise.resolve('OK')
}

export { Redis }
