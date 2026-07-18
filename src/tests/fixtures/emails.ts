import type { EmailInput } from "../../types/email.types.js";

export interface EmailFixture {
  name: string;
  input: EmailInput;
  expected:
    | { ignore: true }
    | { ignore?: false; company: string; role?: string };
}

/**
 * Realistic corpus modeled on actual confirmation/alert formats from the
 * sources CareerPulse targets (India-first + global ATS + remote boards).
 */
export const EMAIL_FIXTURES: EmailFixture[] = [

  /* ============================ INDIA BOARDS ============================ */

  {
    name: "naukri application confirmation",
    input: {
      subject: "Your application has been sent to Infosys",
      sender: '"Naukri.com" <info@naukri.com>',
      snippet:
        "Your application has been sent to Infosys for the position of Software Engineer. The recruiter will contact you if shortlisted.",
    },
    expected: { company: "Infosys", role: "Software Engineer" },
  },
  {
    name: "naukri application forwarded",
    input: {
      subject: "Application sent to TCS",
      sender: '"Naukri.com" <info@naukri.com>',
      snippet:
        "Your application was forwarded to TCS for the position of Java Developer at Mumbai.",
    },
    expected: { company: "TCS", role: "Java Developer" },
  },
  {
    name: "linkedin easy apply confirmation",
    input: {
      subject: "Your application was sent to Swiggy",
      sender: '"LinkedIn" <jobs-noreply@linkedin.com>',
      snippet:
        "Your application was sent to Swiggy. Backend Engineer · Bengaluru, Karnataka, India.",
    },
    expected: { company: "Swiggy", role: "Backend Engineer" },
  },
  {
    name: "linkedin application viewed",
    input: {
      subject: "Zomato viewed your application",
      sender: '"LinkedIn" <jobs-noreply@linkedin.com>',
      snippet:
        "Your application was viewed by the hiring team at Zomato. Data Analyst position.",
    },
    expected: { company: "Zomato" },
  },
  {
    name: "indeed apply confirmation",
    input: {
      subject: "Indeed Application: Frontend Developer",
      sender: '"Indeed Apply" <indeedapply@indeed.com>',
      snippet:
        "Your application has been submitted to Razorpay. The employer will review your application.",
    },
    expected: { company: "Razorpay", role: "Frontend Developer" },
  },
  {
    name: "internshala application",
    input: {
      subject: "Application sent to CodeClause",
      sender: '"Internshala" <noreply@internshala.com>',
      snippet:
        "Your application for the Web Development internship at CodeClause has been sent successfully.",
    },
    expected: { company: "CodeClause", role: "Web Development" },
  },
  {
    name: "instahyre application",
    input: {
      subject: "Application submitted",
      sender: '"Instahyre" <notifications@instahyre.com>',
      snippet:
        "Thank you for applying to Meesho for the Senior Product Engineer role. Your profile has been shared with the employer.",
    },
    expected: { company: "Meesho" },
  },
  {
    name: "cutshort application",
    input: {
      subject: "You applied at Dukaan",
      sender: '"CutShort" <hello@cutshort.io>',
      snippet:
        "Your application to Dukaan for the Full Stack Engineer position was received. We will notify you of updates.",
    },
    expected: { company: "Dukaan" },
  },
  {
    name: "foundit application",
    input: {
      subject: "Application Confirmation",
      sender: '"foundit" <noreply@foundit.in>',
      snippet:
        "Thank you for applying to Wipro for the position of Support Engineer through foundit.",
    },
    expected: { company: "Wipro" },
  },
  {
    name: "apna job application",
    input: {
      subject: "Application received",
      sender: '"apna" <noreply@apna.co>',
      snippet:
        "Thank you for applying to Flipkart. Your application for the Operations Executive role is received.",
    },
    expected: { company: "Flipkart" },
  },

  /* ============================ GLOBAL ATS ============================= */

  {
    name: "workday confirmation (unisys)",
    input: {
      subject: "Application Confirmation",
      sender: '"Unisys Recruiting" <noreply@myworkdayjobs.com>',
      snippet:
        "Thank you for your application to Unisys. You are applying to the Student Technical (Short Term) position.",
    },
    expected: { company: "Unisys", role: "Student Technical (Short Term)" },
  },
  {
    name: "workday confirmation (position of)",
    input: {
      subject: "Thank you for applying",
      sender: '"NVIDIA Careers" <noreply@workday.com>',
      snippet:
        "We received your application to NVIDIA. Position of Systems Software Engineer. Our team will review it shortly.",
    },
    expected: { company: "NVIDIA", role: "Systems Software Engineer" },
  },
  {
    name: "ashby confirmation (sarvam)",
    input: {
      subject: "Thank you for applying",
      sender: '"Sarvam Hiring Team" <jobs@ashbyhq.com>',
      snippet:
        "Thank you for your application to Sarvam. We appreciate your interest in the Backend Engineering Intern position.",
    },
    expected: { company: "Sarvam", role: "Backend Engineering Intern" },
  },
  {
    name: "greenhouse confirmation",
    input: {
      subject: "Thank you for applying to Stripe",
      sender: '"Stripe" <no-reply@us.greenhouse-mail.io>',
      snippet:
        "Thank you for applying to Stripe. We have received your application for the Backend Engineer, Payments role and will be reviewing it soon.",
    },
    expected: { company: "Stripe", role: "Backend Engineer" },
  },
  {
    name: "lever confirmation",
    input: {
      subject: "Thank you for your interest in Razorpay",
      sender: '"Razorpay" <no-reply@hire.lever.co>',
      snippet:
        "Thank you for your interest in Razorpay. Our team will review your application for the SDE 2 - Platform role.",
    },
    expected: { company: "Razorpay", role: "SDE 2 - Platform" },
  },
  {
    name: "smartrecruiters confirmation",
    input: {
      subject: "We received your application",
      sender: '"Bosch Careers" <noreply@smartrecruiters.com>',
      snippet:
        "Thank you for applying to Bosch for the Embedded Software Engineer position. Your application is under review.",
    },
    expected: { company: "Bosch", role: "Embedded Software Engineer" },
  },
  {
    name: "icims confirmation",
    input: {
      subject: "Application Received",
      sender: '"Qualcomm Talent" <careers@talent.icims.com>',
      snippet:
        "Thank you for applying to Qualcomm. Your application for the Modem Systems Engineer position has been received.",
    },
    expected: { company: "Qualcomm", role: "Modem Systems Engineer" },
  },
  {
    name: "taleo confirmation",
    input: {
      subject: "Your application to Oracle",
      sender: '"Oracle Recruiting" <no-reply@taleo.net>',
      snippet:
        "Thank you for your application to Oracle for the Applications Developer position. We appreciate your candidacy.",
    },
    expected: { company: "Oracle", role: "Applications Developer" },
  },
  {
    name: "successfactors confirmation",
    input: {
      subject: "Application received",
      sender: '"Siemens Careers" <system@successfactors.com>',
      snippet:
        "Thank you for applying to Siemens for the Graduate Engineer Trainee position. We have received your application.",
    },
    expected: { company: "Siemens", role: "Graduate Engineer Trainee" },
  },
  {
    name: "workable confirmation",
    input: {
      subject: "Thank you for applying to Postman",
      sender: '"Postman" <no-reply@workablemail.com>',
      snippet:
        "Thank you for applying to Postman. We received your application for the DevOps Engineer position.",
    },
    expected: { company: "Postman", role: "DevOps Engineer" },
  },
  {
    name: "zoho recruit confirmation",
    input: {
      subject: "Application Received - Software Engineer",
      sender: '"Freshworks Careers" <noreply@zohorecruit.com>',
      snippet:
        "Thank you for applying to Freshworks. Your application for Software Engineer has been received and is under review.",
    },
    expected: { company: "Freshworks", role: "Software Engineer" },
  },
  {
    name: "keka confirmation",
    input: {
      subject: "Thank you for applying",
      sender: '"Chargebee HR" <noreply@kekamail.com>',
      snippet:
        "Thank you for applying to Chargebee for the QA Engineer position. Our hiring team will get back to you.",
    },
    expected: { company: "Chargebee", role: "QA Engineer" },
  },
  {
    name: "darwinbox confirmation",
    input: {
      subject: "Application received",
      sender: '"Tata Digital" <careers@darwinbox.in>',
      snippet:
        "Thank you for your application to Tata Digital. Your application for the Android Developer role is received.",
    },
    expected: { company: "Tata Digital" },
  },
  {
    name: "jazzhr confirmation",
    input: {
      subject: "Your application to Turing",
      sender: '"Turing Jobs" <no-reply@applytojob.com>',
      snippet:
        "Thank you for applying to Turing. We will review your application for the Remote Backend Developer position shortly.",
    },
    expected: { company: "Turing", role: "Remote Backend Developer" },
  },

  /* ======================= DIRECT COMPANY EMAILS ======================= */

  {
    name: "direct confirmation with role",
    input: {
      subject: "Application received",
      sender: "careers@stripe.com",
      snippet: "Thanks for applying to Stripe for SDE",
    },
    expected: { company: "Stripe", role: "Software Engineer" },
  },
  {
    name: "direct confirmation - application for X at Y",
    input: {
      subject: "Application for Data Scientist at Fractal",
      sender: '"Fractal Careers" <careers@fractal.ai>',
      snippet:
        "We have received your application for Data Scientist at Fractal. Our recruitment team will review it.",
    },
    expected: { company: "Fractal", role: "Data Scientist" },
  },
  {
    name: "direct interview invite",
    input: {
      subject: "Interview Invitation - Atlassian",
      sender: '"Atlassian Recruiting" <recruiting@atlassian.com>',
      snippet:
        "We would like to invite you to an interview for the Site Reliability Engineer position at Atlassian.",
    },
    expected: { company: "Atlassian", role: "Site Reliability Engineer" },
  },
  {
    name: "direct rejection",
    input: {
      subject: "Update on your application",
      sender: '"Google Careers" <no-reply@google.com>',
      snippet:
        "Thank you for your interest in Google. Unfortunately, we will not be moving forward with your application for Software Engineer III.",
    },
    expected: { company: "Google" },
  },
  {
    name: "direct offer",
    input: {
      subject: "Offer Letter - Zerodha",
      sender: '"Zerodha HR" <hr@zerodha.com>',
      snippet:
        "Congratulations! We are pleased to offer you the position of Frontend Engineer at Zerodha. Your offer letter is attached.",
    },
    expected: { company: "Zerodha", role: "Frontend Engineer" },
  },
  {
    name: "direct assessment",
    input: {
      subject: "Online Assessment - Amazon SDE",
      sender: '"Amazon Recruiting" <no-reply@amazon.jobs>',
      snippet:
        "Thank you for applying to Amazon. Please complete the online assessment for the SDE 1 position within 7 days.",
    },
    expected: { company: "Amazon" },
  },
  {
    name: "wellfound application submitted",
    input: {
      subject: "Your application was submitted",
      sender: '"Wellfound" <team@wellfound.com>',
      snippet:
        "Your application to Supabase for the Support Engineer role was submitted. The team typically responds in a week.",
    },
    expected: { company: "Supabase", role: "Support Engineer" },
  },
  {
    name: "yc work at a startup",
    input: {
      subject: "Application sent",
      sender: '"Work at a Startup" <noreply@workatastartup.com>',
      snippet:
        "Your application was sent to PostHog for the Product Engineer role.",
    },
    expected: { company: "PostHog", role: "Product Engineer" },
  },

  /* ============================== JUNK ================================ */

  {
    name: "seek job recommendations",
    input: {
      subject: "Software Engineer + 11 new jobs",
      sender: "jobs@email.seek.com",
      snippet: "New jobs matching your saved search criteria.",
    },
    expected: { ignore: true },
  },
  {
    name: "jobright daily alert",
    input: {
      subject: "Daily Job Alert",
      sender: "noreply@jobright.ai",
      snippet: "Here are today's recommended jobs for you.",
    },
    expected: { ignore: true },
  },
  {
    name: "naukri job alerts sender",
    input: {
      subject: "5 Software Engineer jobs in Bangalore",
      sender: '"Naukri Alerts" <naukrialerts@naukri.com>',
      snippet: "Apply now to jobs matching your profile.",
    },
    expected: { ignore: true },
  },
  {
    name: "naukri recommended jobs",
    input: {
      subject: "Recommended jobs for you",
      sender: '"Naukri.com" <info@naukri.com>',
      snippet: "Based on your profile, these jobs may interest you.",
    },
    expected: { ignore: true },
  },
  {
    name: "linkedin job digest",
    input: {
      subject: "30+ new jobs for \"software engineer\"",
      sender: '"LinkedIn Job Alerts" <jobalerts-noreply@linkedin.com>',
      snippet: "Software Engineer roles in Bengaluru. Apply now.",
    },
    expected: { ignore: true },
  },
  {
    name: "linkedin appeared in searches",
    input: {
      subject: "You appeared in 9 searches this week",
      sender: '"LinkedIn" <notifications-noreply@linkedin.com>',
      snippet: "See who's searching for people like you.",
    },
    expected: { ignore: true },
  },
  {
    name: "linkedin invitation",
    input: {
      subject: "Invitation to connect",
      sender: '"LinkedIn" <invitations@linkedin.com>',
      snippet: "Rahul wants to connect with you on LinkedIn.",
    },
    expected: { ignore: true },
  },
  {
    name: "indeed new jobs",
    input: {
      subject: "New jobs for you: Backend Developer",
      sender: '"Indeed" <alert@indeed.com>',
      snippet: "10 new jobs match your preferences.",
    },
    expected: { ignore: true },
  },
  {
    name: "internshala trainings promo",
    input: {
      subject: "Get 55% off on all Internshala Trainings",
      sender: '"Internshala Trainings" <trainings@internshala.com>',
      snippet: "Learn web development at 55% off. Enroll now and get certificate.",
    },
    expected: { ignore: true },
  },
  {
    name: "wellfound weekly digest",
    input: {
      subject: "Trending startups hiring now",
      sender: '"Wellfound" <team@wellfound.com>',
      snippet: "10 featured startups this week are hiring remote engineers.",
    },
    expected: { ignore: true },
  },
  {
    name: "gmail promotions category",
    input: {
      subject: "Your dream job is waiting",
      sender: '"TopHire" <hello@tophire.co>',
      snippet: "Join thousands of engineers finding jobs through TopHire.",
      labelIds: ["CATEGORY_PROMOTIONS", "INBOX"],
    },
    expected: { ignore: true },
  },
  {
    name: "upskilling course promo",
    input: {
      subject: "Master DSA - 50% off this weekend",
      sender: '"Scaler" <marketing@scaler.com>',
      snippet: "Crack any interview with our DSA course. Limited period discount.",
    },
    expected: { ignore: true },
  },
  {
    name: "newsletter",
    input: {
      subject: "Weekly Career Newsletter",
      sender: "newsletter@indeed.com",
      snippet: "Top jobs and hiring trends this week.",
    },
    expected: { ignore: true },
  },
  {
    name: "job board marketing",
    input: {
      subject: "Discover new opportunities",
      sender: "marketing@jobboard.com",
      snippet: "Explore thousands of open positions on our platform.",
    },
    expected: { ignore: true },
  },
  {
    name: "naukri profile visibility promo",
    input: {
      subject: "Increase your profile visibility",
      sender: '"Naukri.com" <info@naukri.com>',
      snippet: "Recruiters are searching. Boost your profile with Naukri FastForward subscription.",
    },
    expected: { ignore: true },
  },
  {
    name: "glassdoor salaries newsletter",
    input: {
      subject: "Salary report: What engineers earn in 2026",
      sender: '"Glassdoor" <noreply@glassdoor.com>',
      snippet: "Explore salaries, reviews and jobs for you.",
    },
    expected: { ignore: true },
  },
  {
    name: "generic unrelated email",
    input: {
      subject: "Your electricity bill is due",
      sender: "billing@bescom.org",
      snippet: "Your bill of Rs. 1,240 is due on 25th July.",
    },
    expected: { ignore: true },
  },
  {
    name: "food delivery email",
    input: {
      subject: "Your order is on the way",
      sender: '"Swiggy" <noreply@swiggy.in>',
      snippet: "Your order from Meghana Foods will be delivered in 20 minutes.",
    },
    expected: { ignore: true },
  },
];
