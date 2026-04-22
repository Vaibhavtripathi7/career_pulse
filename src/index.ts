import express from "express";
import router from './routes/health.js';
// import router_hook from "./routes/webhook.js";
import router_for_mail from "./routes/sync.js";
import router_db from "./routes/application.js";
import cors from 'cors';
import authrouter from "./routes/auth.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, 
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/health', router)
// app.use('/api/webhook', router_hook);
app.use('/api/sync', router_for_mail);
app.use('/api/applications', router_db)
app.use('/api/auth', authrouter);

app.listen(PORT, ()=>{
    console.log("server is alive")
})
