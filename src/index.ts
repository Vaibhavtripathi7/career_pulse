import express from "express";
import router from './routes/health.js';
import type { Response, Request } from "express";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/health', router)

app.listen(PORT, ()=>{
    console.log("server is alive")
})

// previous code -- 

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

// type results = 
async function processEmails(){
    try {
        let result = await fetchLatestApplicationFromGmail();
        console.log(`successfully parsed application data for company ${result.companyName} and Current status: ${result.status}`)
    } catch (error) {
        console.log(`Network error: ${error}`)
    }
}

// console.log(myFirstApplication)
