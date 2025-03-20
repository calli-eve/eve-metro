import { exchangeCodeForToken, verifyToken, getCharacter } from '../../../data/eveAuthClient'
import { NextApiResponse } from 'next'
import { Session } from '../../../types/types'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'

export default publicHandler().post<ExtendedRequest<{ code: string }>, NextApiResponse>(
    async (req, res) => {
        const code: string = req.body.code
        const tokenResponse = await exchangeCodeForToken(code)
        const verificationResponse = await verifyToken(tokenResponse.data)
        const characterResponse = await getCharacter(verificationResponse.data.CharacterID)

        const session: Session = {
            character: {
                CharacterID: verificationResponse.data.CharacterID,
                CharacterName: verificationResponse.data.CharacterName,
                corporation_id: characterResponse.data.corporation_id,
                alliance_id: characterResponse.data.alliance_id,
                admin: false,
                level: 0
            },
            authorization: tokenResponse.data
        }

        res.status(200).json(session)
    }
) 