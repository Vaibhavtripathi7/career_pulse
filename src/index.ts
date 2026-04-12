import express from "express";
import router from './routes/health.js';
import router_hook from "./routes/webhook.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/health', router)
app.use('/api/webhook', router_hook);

app.listen(PORT, ()=>{
    console.log("server is alive")
})
