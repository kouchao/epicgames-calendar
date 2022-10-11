import dayjs from 'dayjs'
import ics from 'ics'
import { writeFileSync } from 'fs'

const events = []
let logText = ''

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
  let subTitle = '正在进行'
  if (o?.promotions?.promotionalOffers?.length) {
    q = o.promotions.promotionalOffers[0].promotionalOffers[0]
  } else {
    subTitle = '即将开始'
    q = o.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
  }

  const info = `${index + 1}. ${subTitle}：${o.title}【${
    o.price.totalPrice.currencyCode
  } ${o.price.totalPrice.originalPrice / 100}】 ${time(q?.startDate)} ~ ${time(
    q?.endDate
  )}`

  logText += `<p><a title="${o.title}" href="https://store.epicgames.com/zh-CN/p/${o.catalogNs.mappings[0].pageSlug}" target="_blank">${info}</a></p>\n`
  console.log(info)
}

const createEvent = (o) => {
  const event = {
    productId: 'kouchao/epicgames',
    uid: o.catalogNs.mappings[0].pageSlug,
    lastModified: eventTime(),
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

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>epicgames calendar</title>
</head>
<body>
<h2>上次更新时间：${dayjs().format('YYYY-MM-DD HH:MM:ss')}</h2>
${logText}
</body>
</html>`

writeFileSync(`./index.html`, html)
