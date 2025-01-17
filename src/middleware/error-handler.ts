import { NextApiResponse } from 'next'

export const onError = <T, S extends NextApiResponse>(err, req: T, res: NextApiResponse, next) => {
    console.log(err)
    return res.status(500).end()
}
