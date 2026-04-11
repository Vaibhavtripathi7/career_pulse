
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


