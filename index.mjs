import dayjs from 'dayjs'
import ics from 'ics'
import { writeFileSync } from 'fs'

const events = []

const time = (date) => dayjs(date).format('YYYY-MM-DD HH:MM')
const eventTime = (date) =>
  [
    dayjs(date).format('YYYY'),
    dayjs(date).format('MM'),
    dayjs(date).format('DD'),
    dayjs(date).format('HH'),
    dayjs(date).format('MM'),
  ].map((o) => Number(o))

const log = (o, index) => {
  let q
  if (o?.promotions?.promotionalOffers?.length) {
    q = o.promotions.promotionalOffers[0].promotionalOffers[0]
  } else {
    q = o.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
  }

  console.log(
    `${index + 1}. 即将开始：${o.title}【${o.price.totalPrice.currencyCode} ${
      o.price.totalPrice.originalPrice / 100
    }】 ${time(q?.startDate)} ~ ${time(q?.endDate)}`
  )
}

const createEvent = (o) => {
  const event = {
    productId: 'kouchao/epicgames',
    uid: o.catalogNs.mappings[0].pageSlug,
    lastModified: eventTime(new Date()),
    title: o.title,
    description: `${o.description}
原价：${o.price.totalPrice.currencyCode} ${
      o.price.totalPrice.originalPrice / 100
    }
发行商：${o.seller.name}`,
    url: `https://store.epicgames.com/zh-CN/p/${o.catalogNs.mappings[0].pageSlug}`,
  }

  let q
  if (o?.promotions?.promotionalOffers?.length) {
    q = o.promotions.promotionalOffers[0].promotionalOffers[0]
  } else {
    q = o.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
    event.status = 'TENTATIVE'
  }

  events.push({
    ...event,
    start: eventTime(q?.startDate),
    end: eventTime(q?.endDate),
  })
}

const res = await fetch(
  'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN'
)
if (res.ok) {
  const data = await res.json()

  const promotions = (data?.data?.Catalog?.searchStore?.elements || []).filter(
    (o) => o?.price?.totalPrice?.originalPrice && o?.promotions
  )

  promotions.forEach((o, index) => {
    log(o, index)
    createEvent(o)
  })
}

//  事件

ics.createEvents(events, (error, value) => {
  if (error) {
    console.log(error)
    return
  }

  writeFileSync(`./event.ics`, value)
})
