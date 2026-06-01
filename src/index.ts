import app from "./app.js"
import { emailCronService } from "./services/cron.js";
import "./email.worker.js";

const PORT = 3000;

if (process.env.NODE_ENV !== "test"){
    app.listen(PORT, ()=>{
        console.log("server is alive");
        emailCronService.start();
})
}

export default app;