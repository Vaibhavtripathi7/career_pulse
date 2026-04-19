function extractCleanData(sender: string){

    if (!sender) return "Unknown Company"

    if (sender.includes('<')){

        const subject_Name = sender.split('<')[0];
        return subject_Name?.trim()

    }if(sender.includes('@')){

        const domain_Name = sender.split('@')[0];
        const subject_Name = domain_Name?.split('.')[0];

        if(subject_Name){
            return subject_Name.charAt(0).toUpperCase() + subject_Name.slice(1);
        }
    }
    return "Unknown Company";
}

export function exractWorkmodel(subject: string): string{
    if (!subject) return "Unknown";

    const lowerSubject = subject.toLowerCase();
    if (lowerSubject.includes('remote')) return "Remote";
    if (lowerSubject.includes('Hybrid')) return "Hybrid";
    if (lowerSubject.includes('onsite') || lowerSubject.includes('on-site')) return "Onsite";

    return "Unkown";
}

export function extractRole(subject:string) {
    if (!subject) return "Unknown role";
    const lowerSubject = subject.toLowerCase();

    if (lowerSubject.includes('application for')){
        const textafter = subject.split(/application for/i)[1];
        const role = textafter?.split(/ at | - | in | received /i)[0];

        return role?.trim();
    }
    return "Software Engineer";
}

export default extractCleanData;