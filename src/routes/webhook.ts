import express from  'express';
import type {Response, Request } from "express";
import requiresKey from '../middlewares/auth.js';

interface JobApplicationEvent { 
    companyName: string;
    role: string;
    status: "Applied" | "Interviewing" | "Rejected"| "Offer" ;
    workModel: "Remote"|"Onsite"| "Hybrid"; 
    dateApplied: string;
}

const myFirstApplication: JobApplicationEvent = { 

    companyName: "Google", 
    role: "SDE Intern",
    status: "Applied",
    workModel: "Remote",
    dateApplied: "something"
};

function fetchLatestApplicationFromGmail(): Promise<JobApplicationEvent> { 
    return new Promise((resolve, reject) => {
        console.log("Fetching from servers");

        setTimeout(()=> {
            resolve(myFirstApplication);
        }, 2000);
    })
} 

const router_hook = express.Router();
router_hook.post('/',requiresKey, async(req:Request, res:Response)=> {

    try{
        let results = await fetchLatestApplicationFromGmail();
        console.log(`Company name: ${results.companyName} and status: ${results.status}`);
        res.status(200).send("Webhook processed successfully");
    }catch(error){
        console.log(`Network error! ${error}`);
        res.status(500).send("Internal Server Error");
    }
});


export default router_hook;
