import { NextApiResponse } from 'next'
import sharp from 'sharp'
import xmldom from 'xmldom'

import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'
import cache from '../../../middleware/cache'

export default publicHandler()
    .use(cache('60 minutes'))
    .get<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
        const { classId } = req.query
        const svg = `<svg width="250" height="250">
        <circle cx="125" cy="125" r="125" fill="#009dff" />
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="90px" font-family="sans-serif" dy=".3em">${
            classId ? `C${classId}` : ''
        }</text>
    </svg>
   `
        const parsedSvg = new xmldom.DOMParser().parseFromString(svg, 'text/xml')
        const img = await sharp(
            Buffer.from(new xmldom.XMLSerializer().serializeToString(parsedSvg))
        )
            .png()
            .toBuffer()
        res.setHeader('Content-Type', 'image/png')
        res.send(img)
        res.end()
    })
