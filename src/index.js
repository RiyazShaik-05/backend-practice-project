import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from './app.js'
dotenv.config({
    path: './.env'
})



const port = process.env.PORT || 1628;

connectDB()
.then(()=>{
    app.on("error",()=>{
        console.log("error: ",error);
    });

    app.listen(port,()=>{
        console.log(`Server listening on port ${port}`);
    })
})
.catch((error)=>{
    console.log("Error Connecting to Database !!!!",error);
});