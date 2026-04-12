import type {Request, Response, NextFunction} from 'express';

function requiresKey(req:Request, res:Response, nextfunction:NextFunction){

    const apikey = req.headers['x-api-key'];
    if (apikey === "careerpulse-super-secret") {
        nextfunction();
    } else {
        res.status(401).json({error: "Unauthorized!"});
    }

}
export default requiresKey;