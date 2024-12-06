import dotenv from "dotenv"
dotenv.config({path:"./.env"});

import app from "./app.js"

import connectDB from "./db/index.js";



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